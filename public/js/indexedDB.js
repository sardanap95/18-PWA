const storeName, mode, dbCursor;
class indexedDB {
  constructor(storeName, mode) {
    console.log(storeName, "", mode);
    this.storeName = storeName;
    this.mode = mode;
  }
  openDatabase() {
    var indexedDBOpenRequest = indexedDB.open("transaction-db");
    indexedDBOpenRequest.onerror = function (error) {
      // error creatimg db
      console.error("IndexedDB error:", error);
    };

    indexedDBOpenRequest.onupgradeneeded = function () {
      // This should only execute if there's a need to create/update db.
      this.result.createObjectStore(storeName, { autoIncrement: true, keyPath: "id" });
    };

    // This will execute each time the database is opened.
    indexedDBOpenRequest.onsuccess = function () {
      console.log("IndexDB created successfully.");
      dbCursor = this.result;
    };
  }
}

export let dbCursor;
