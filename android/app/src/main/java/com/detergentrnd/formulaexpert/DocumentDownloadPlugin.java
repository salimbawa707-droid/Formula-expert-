package com.detergentrnd.formulaexpert;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "DocumentDownload")
public class DocumentDownloadPlugin extends Plugin {
    private static final long MAX_BYTES = 20L * 1024L * 1024L;

    @PluginMethod
    public void saveAttachment(PluginCall call) {
        String encoded = call.getString("base64");
        String requestedName = call.getString("fileName", "document");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        if (encoded == null || encoded.isEmpty()) {
            call.reject("Attachment data is empty.");
            return;
        }

        byte[] bytes;
        try {
            bytes = Base64.decode(encoded, Base64.DEFAULT);
        } catch (IllegalArgumentException error) {
            call.reject("Attachment data is not valid Base64.");
            return;
        }
        if (bytes.length == 0 || bytes.length > MAX_BYTES) {
            call.reject("Attachment must be between 1 byte and 20 MB.");
            return;
        }

        String safeName = new File(requestedName).getName().replaceAll("[^A-Za-z0-9._ -]", "_");
        if (safeName.isEmpty() || safeName.equals(".") || safeName.equals("..")) safeName = "document";
        OutputStream output = null;
        Uri savedUri = null;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, safeName);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Formula Expert");
                values.put(MediaStore.Downloads.IS_PENDING, 1);
                savedUri = getContext().getContentResolver().insert(MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), values);
                if (savedUri == null) throw new IllegalStateException("Android could not create the Downloads entry.");
                output = getContext().getContentResolver().openOutputStream(savedUri);
                if (output == null) throw new IllegalStateException("Android could not open the Downloads file.");
                output.write(bytes);
                output.flush();
                output.close();
                output = null;
                ContentValues completed = new ContentValues();
                completed.put(MediaStore.Downloads.IS_PENDING, 0);
                getContext().getContentResolver().update(savedUri, completed, null, null);
            } else {
                File downloads = new File(getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "Formula Expert");
                if (!downloads.exists() && !downloads.mkdirs()) throw new IllegalStateException("Could not create the app Downloads folder.");
                File target = new File(downloads, safeName);
                output = new FileOutputStream(target);
                output.write(bytes);
                output.flush();
                output.close();
                output = null;
                savedUri = Uri.fromFile(target);
            }

            JSObject result = new JSObject();
            result.put("uri", savedUri.toString());
            result.put("fileName", safeName);
            result.put("sizeBytes", bytes.length);
            result.put("location", Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? "Downloads/Formula Expert" : "App Downloads/Formula Expert");
            call.resolve(result);
        } catch (Exception error) {
            if (output != null) {
                try { output.close(); } catch (Exception ignored) {}
            }
            if (savedUri != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                try { getContext().getContentResolver().delete(savedUri, null, null); } catch (Exception ignored) {}
            }
            call.reject("Could not save attachment to Downloads: " + error.getMessage(), error);
        }
    }
}
