package com.cscsmarttoolkit.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableMap
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import java.io.File
import java.io.FileInputStream

class Phase6NativeModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

    companion object {
        private const val DIRECTORY_REQUEST = 6206
    }

    private var directoryPromise: Promise? = null

    override fun getName(): String = "Phase6Native"

    @ReactMethod
    fun pickDirectory(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "A foreground activity is required to choose a folder.")
            return
        }
        if (directoryPromise != null) {
            promise.reject("PICKER_BUSY", "The folder picker is already open.")
            return
        }
        directoryPromise = promise
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
            addFlags(
                Intent.FLAG_GRANT_READ_URI_PERMISSION or
                    Intent.FLAG_GRANT_WRITE_URI_PERMISSION or
                    Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
            )
        }
        activity.startActivityForResult(intent, DIRECTORY_REQUEST)
    }

    fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != DIRECTORY_REQUEST) return
        val promise = directoryPromise ?: return
        directoryPromise = null
        if (resultCode != Activity.RESULT_OK || data?.data == null) {
            promise.resolve(null)
            return
        }
        val uri = data.data!!
        val flags = data.flags and
            (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        try {
            context.contentResolver.takePersistableUriPermission(uri, flags)
        } catch (_: SecurityException) {
            // Some providers do not offer persistable permissions. The current
            // selection is still usable for this session.
        }
        promise.resolve(uri.toString())
    }

    @ReactMethod
    fun saveFileToTree(sourcePath: String, treeUri: String, fileName: String, promise: Promise) {
        try {
            val destination = createDocument(treeUri, mimeFor(fileName), fileName)
            context.contentResolver.openOutputStream(destination)?.use { output ->
                FileInputStream(File(sourcePath)).use { input -> input.copyTo(output) }
            } ?: throw IllegalStateException("The selected folder could not be opened.")
            promise.resolve(destination.toString())
        } catch (error: Exception) {
            promise.reject("SAVE_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun listTreeFiles(treeUri: String, promise: Promise) {
        try {
            val files = Arguments.createArray()
            val childrenUri = childDocumentsUri(treeUri)
            context.contentResolver.query(
                childrenUri,
                arrayOf(
                    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                    DocumentsContract.Document.COLUMN_SIZE,
                    DocumentsContract.Document.COLUMN_LAST_MODIFIED,
                    DocumentsContract.Document.COLUMN_MIME_TYPE,
                ),
                null,
                null,
                "${DocumentsContract.Document.COLUMN_DISPLAY_NAME} COLLATE NOCASE ASC",
            )?.use { cursor ->
                val idIndex = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DOCUMENT_ID)
                val nameIndex = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_SIZE)
                val modifiedIndex = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_LAST_MODIFIED)
                val mimeIndex = cursor.getColumnIndex(DocumentsContract.Document.COLUMN_MIME_TYPE)
                while (cursor.moveToNext()) {
                    val documentUri = DocumentsContract.buildDocumentUriUsingTree(
                        Uri.parse(treeUri),
                        cursor.getString(idIndex),
                    )
                val item: WritableMap = Arguments.createMap().apply {
                        putString("name", cursor.getString(nameIndex) ?: "")
                        putString("path", documentUri.toString())
                        putString("uri", documentUri.toString())
                        putDouble("size", if (cursor.isNull(sizeIndex)) 0.0 else cursor.getLong(sizeIndex).toDouble())
                        putDouble("modifiedAt", if (cursor.isNull(modifiedIndex)) 0.0 else cursor.getLong(modifiedIndex).toDouble())
                        putString("mimeType", cursor.getString(mimeIndex) ?: "application/octet-stream")
                        putBoolean("isDirectory", cursor.getString(mimeIndex) == DocumentsContract.Document.MIME_TYPE_DIR)
                    }
                    files.pushMap(item)
                }
            }
            promise.resolve(files)
        } catch (error: Exception) {
            promise.reject("LIST_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun deleteTreeFile(uri: String, promise: Promise) {
        try {
            if (!DocumentsContract.deleteDocument(context.contentResolver, Uri.parse(uri))) {
                throw IllegalStateException("The file could not be deleted.")
            }
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("DELETE_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun renameTreeFile(uri: String, newName: String, promise: Promise) {
        try {
            if (DocumentsContract.renameDocument(context.contentResolver, Uri.parse(uri), safeName(newName)) == null) {
                throw IllegalStateException("The file could not be renamed.")
            }
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("RENAME_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun copyTreeFile(uri: String, treeUri: String, destinationName: String, promise: Promise) {
        try {
            val source = Uri.parse(uri)
            val destination = createDocument(treeUri, mimeFor(destinationName), destinationName)
            context.contentResolver.openInputStream(source)?.use { input ->
                context.contentResolver.openOutputStream(destination)?.use { output ->
                    input.copyTo(output)
                }
            } ?: throw IllegalStateException("The source file could not be opened.")
            promise.resolve(destination.toString())
        } catch (error: Exception) {
            promise.reject("COPY_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun executeSql(sql: String, params: ReadableArray, promise: Promise) {
        try {
            val database = openDatabase()
            sql.split(";")
                .map(String::trim)
                .filter(String::isNotEmpty)
                .forEach { statement -> database.execSQL(statement, sqlArgs(params)) }
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("SQL_EXEC_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun querySql(sql: String, params: ReadableArray, promise: Promise) {
        try {
            val rows = Arguments.createArray()
            openDatabase().rawQuery(sql, sqlArgs(params)).use { cursor ->
                while (cursor.moveToNext()) rows.pushMap(cursorRow(cursor))
            }
            promise.resolve(rows)
        } catch (error: Exception) {
            promise.reject("SQL_QUERY_FAILED", error.message, error)
        }
    }

    private fun childDocumentsUri(treeUri: String): Uri {
        val tree = Uri.parse(treeUri)
        val documentId = DocumentsContract.getTreeDocumentId(tree)
        return DocumentsContract.buildChildDocumentsUriUsingTree(tree, documentId)
    }

    private fun createDocument(treeUri: String, mimeType: String, fileName: String): Uri {
        return DocumentsContract.createDocument(
            context.contentResolver,
            Uri.parse(treeUri),
            mimeType,
            safeName(fileName),
        ) ?: throw IllegalStateException("The selected folder could not create a file.")
    }

    private fun openDatabase(): SQLiteDatabase =
        context.openOrCreateDatabase("csc_smart_toolkit.db", 0, null)

    private fun sqlArgs(params: ReadableArray): Array<Any?> =
        Array(params.size()) { index ->
            when (params.getType(index)) {
                ReadableType.Null -> null
                ReadableType.Boolean -> params.getBoolean(index)
                ReadableType.Number -> params.getDouble(index)
                ReadableType.String -> params.getString(index)
                else -> params.getString(index)
            }
        }

    private fun cursorRow(cursor: Cursor): WritableMap {
        val row = Arguments.createMap()
        cursor.columnNames.forEachIndexed { index, name ->
            when (cursor.getType(index)) {
                Cursor.FIELD_TYPE_NULL -> row.putNull(name)
                Cursor.FIELD_TYPE_INTEGER -> row.putDouble(name, cursor.getLong(index).toDouble())
                Cursor.FIELD_TYPE_FLOAT -> row.putDouble(name, cursor.getDouble(index))
                else -> row.putString(name, cursor.getString(index))
            }
        }
        return row
    }

    private fun safeName(name: String): String =
        name.replace(Regex("[\\\\/:*?\"<>|]"), "_").ifBlank { "export" }

    private fun mimeFor(name: String): String = when (name.substringAfterLast('.', "").lowercase()) {
        "png" -> "image/png"
        "jpg", "jpeg" -> "image/jpeg"
        "webp" -> "image/webp"
        "pdf" -> "application/pdf"
        "zip" -> "application/zip"
        else -> "application/octet-stream"
    }
}