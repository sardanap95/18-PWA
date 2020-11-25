const staticCacheName = "site-static-v2";
const dynamicCacheName = "site-dynamic-v2";
const assets = [
  "/",
  "/index.html",
  "https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css",
  "/styles.css",
  "/js/index.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];
var transactionData;
var our_db;

// cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};
// Install event
self.addEventListener("install", (evt) => {
  console.log("Service worker installed");
  //Caching our application.
  evt.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      console.log("Caching shell assets");
      cache.addAll(assets);
    })
  );
});

// Activate event
self.addEventListener("activate", (evt) => {
  console.log("Service worker activated");
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== staticCacheName && key !== dynamicCacheName)
          .map((key) => caches.delete(key))
      );
    })
  );
});

//Fetch event:- if the app goes offline the fetches goes through SW.
self.addEventListener("fetch", function (event) {
  if (event.request.method === "GET") {
    event.respondWith(
      // check all the caches in the browser and find
      // out whether our request is in any of them
      caches.match(event.request).then(function (response) {
        if (response) {
          // if we are here, that means there's a match
          //return the response stored in browser
          return response;
        }
        // no match in cache, use the network instead
        return fetch(event.request);
      })
    );
  } else if (event.request.clone().method === "POST") {
    // attempt to send request normally
    console.log("Transaction Data:-", transactionData);
    event.respondWith(
      fetch(event.request.clone()).catch(function (error) {
        // only save post requests in browser, if an error occurs
        savePostRequests(event.request.clone().url, transactionData);
      })
    );
  }
});

// Message event - To listen to data sent by our app.
self.addEventListener("message", (evt) => {
  console.log("Transaction data received in SW." + JSON.stringify(evt.data));
  transactionData = evt.data;
});

//Sync event - To check internet
self.addEventListener("sync", (evt) => {
  console.log("We are live on internet");
  if (evt.tag === "sendTransactionData") {
    evt.waitUntil(sendPostRequest());
  }
});

//Post request for transaction data

function sendPostRequest() {
  console.log("Re-Sending post request.");
  var savedRequests = [];
  var req = getObjectStore("postRequestsDB").openCursor();

  req.onsuccess = async function (evt) {
    var cursor = evt.target.result;

    if (cursor) {
      // Keep moving the cursor forward and collecting saved requests.
      savedRequests.push(cursor.value);
      cursor.continue();
    } else {
      // At this point, we have collected all the post requests in indexedb.
      for (let savedRequest of savedRequests) {
        // send them to the server one after the other
        console.log("Saved request", savedRequest);
        var requestUrl = savedRequest.url;
        var payload = JSON.stringify(savedRequest.payload);
        var method = savedRequest.method;
        var headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        }; // if you have any other headers put them here
        fetch(requestUrl, {
          headers: headers,
          method: method,
          body: payload,
        })
          .then(function (response) {
            console.log("Server response", response);
            if (response.status < 400) {
              // If sending the POST request was successful, then remove it from the IndexedDB.
              getObjectStore("postRequestsDB", "readwrite").delete(savedRequest.id);
            }
          })
          .catch(function (error) {
            // This will be triggered if the network is still down. The request will be replayed again
            // the next time the service worker starts up.
            console.error("Send to Server failed:", error);
            // since we are in a catch, it is important an error is thrown,
            // so the background sync knows to keep retrying sendto server
            throw error;
          });
      }
    }
  };
}

function savePostRequests(url, payload) {
  console.log("Saving post request");
  var request = getObjectStore("postRequestsDB", "readwrite").add({
    url: url,
    payload: payload,
    method: "POST",
  });
  request.onsuccess = function (event) {
    console.log("A new pos_ request has been added to indexedb");
  };
  request.onerror = function (error) {
    console.error(error);
  };
}

//Creating IndexDB

function getObjectStore(storeName, mode) {
  return our_db.transaction(storeName, mode).objectStore(storeName);
}

function openDatabase() {
  var indexedDBOpenRequest = indexedDB.open("transaction-db");

  indexedDBOpenRequest.onerror = function (error) {
    // error creatimg db
    console.error("IndexedDB error:", error);
  };

  indexedDBOpenRequest.onupgradeneeded = function () {
    // This should only execute if there's a need to create/update db.
    this.result.createObjectStore("postRequestsDB", { autoIncrement: true, keyPath: "id" });
  };

  // This will execute each time the database is opened.
  indexedDBOpenRequest.onsuccess = function () {
    console.log("IndexDB created successfully.");
    our_db = this.result;
  };
}

openDatabase();
