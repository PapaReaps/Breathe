package io.github.papareaps.breathe.money;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Pattern;

/**
 * "Download and install" for a new version (see docs/ANDROID-APP.md).
 *
 * - It only downloads from Breathe Money's own GitHub releases: any other address is refused.
 * - The file goes in the app's private cache, and is checked to really be Breathe Money.
 * - Android's own installer then asks the person. Android also refuses any update that isn't
 *   signed with the same key as the installed app, so a swapped file could never replace it.
 * Nothing about the person or their numbers is sent.
 */
@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    private static final Pattern ALLOWED = Pattern.compile(
        "^https://github\\.com/PapaReaps/Breathe/releases/download/v\\d{1,4}\\.\\d{1,4}\\.\\d{1,4}/breathe-money-v\\d{1,4}\\.\\d{1,4}\\.\\d{1,4}\\.apk$"
    );
    private static final long MAX_BYTES = 100L * 1024 * 1024;
    private static final String FILE_NAME = "breathe-money-update.apk";

    private File updateFile() {
        File folder = new File(getContext().getCacheDir(), "updates");
        if (!folder.exists()) folder.mkdirs();
        return new File(folder, FILE_NAME);
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String address = call.getString("url", "");
        if (address == null || !ALLOWED.matcher(address).matches()) {
            call.reject("not-allowed");
            return;
        }
        new Thread(() -> {
            File target = updateFile();
            File partial = new File(target.getPath() + ".part");
            HttpURLConnection connection = null;
            try {
                connection = (HttpURLConnection) new URL(address).openConnection();
                connection.setInstanceFollowRedirects(true);
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.setRequestProperty("Accept", "application/octet-stream");
                int status = connection.getResponseCode();
                if (status != 200 || !"https".equals(connection.getURL().getProtocol())) {
                    call.reject("not-available");
                    return;
                }
                long total = connection.getContentLengthLong();
                if (total > MAX_BYTES) {
                    call.reject("too-big");
                    return;
                }
                long done = 0;
                int lastPercent = -1;
                try (InputStream in = connection.getInputStream(); OutputStream out = new FileOutputStream(partial)) {
                    byte[] buffer = new byte[64 * 1024];
                    int read;
                    while ((read = in.read(buffer)) != -1) {
                        done += read;
                        if (done > MAX_BYTES) {
                            call.reject("too-big");
                            return;
                        }
                        out.write(buffer, 0, read);
                        if (total > 0) {
                            int percent = (int) (done * 100 / total);
                            if (percent != lastPercent) {
                                lastPercent = percent;
                                JSObject progress = new JSObject();
                                progress.put("percent", percent);
                                notifyListeners("progress", progress);
                            }
                        }
                    }
                }
                if (!isBreatheMoney(partial)) {
                    partial.delete();
                    call.reject("not-breathe");
                    return;
                }
                if (target.exists()) target.delete();
                if (!partial.renameTo(target)) {
                    call.reject("not-saved");
                    return;
                }
                call.resolve();
            } catch (Exception e) {
                partial.delete();
                call.reject("not-available");
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }

    /** The downloaded file must be an app with the same name (package) as this one. */
    private boolean isBreatheMoney(File file) {
        PackageManager manager = getContext().getPackageManager();
        PackageInfo info = manager.getPackageArchiveInfo(file.getPath(), 0);
        return info != null && getContext().getPackageName().equals(info.packageName);
    }

    /** Opens Android's installer for the downloaded file, or says the person's OK is needed first. */
    @PluginMethod
    public void install(PluginCall call) {
        Context context = getContext();
        File file = updateFile();
        if (!file.exists()) {
            call.reject("no-file");
            return;
        }
        JSObject answer = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.getPackageManager().canRequestPackageInstalls()) {
            answer.put("needsPermission", true);
            call.resolve(answer);
            return;
        }
        Uri uri = FileProvider.getUriForFile(context, context.getPackageName() + ".fileprovider", file);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().startActivity(intent);
        answer.put("needsPermission", false);
        call.resolve(answer);
    }

    /** Android's own page for "Allow from this source", for Breathe Money only. */
    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(intent);
        }
        call.resolve();
    }

    /** Removes an old downloaded file, so it doesn't sit taking up space. */
    @PluginMethod
    public void tidyUp(PluginCall call) {
        File file = updateFile();
        if (file.exists()) file.delete();
        call.resolve();
    }
}
