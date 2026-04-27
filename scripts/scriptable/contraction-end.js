// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-red; icon-glyph: stop-circle;
const FILE = "/baby-tracker.csv"

const TYPE = "contraction-end"
const df = new DateFormatter()
df.dateFormat = "yyyy-MM-dd HH:mm:ss"
const now = df.string(new Date())
const headers = "type,date_time"

// Create string to append
const newRecord = TYPE + "," + now

// Check the file
const fm = FileManager.iCloud()
const basePath = fm.documentsDirectory()
const FILE_PATH = basePath + FILE
const fileExists = fm.fileExists(FILE_PATH)

if (fileExists) {
  const data = fm.readString(FILE_PATH)
  fm.writeString(FILE_PATH, data + "\n" + newRecord)
  console.log("Added contraction end!")
} else {
  fm.writeString(FILE_PATH, headers + "\n" + newRecord)
  console.log("Created new file and added contraction end!")
}
return 1;
Script.complete()
