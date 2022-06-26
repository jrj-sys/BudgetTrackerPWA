let db;

// connection to idb, set to version 1
const request = indexedDB.open('BudgetTracker', 1);

// event emits on db version change
request.onupgradeneeded = function(e) {
  const db = e.target.result;
  db.createObjectStore('NewTransaction', { autoIncrement: true });
}

request.onsuccess = function(e) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
  db = e.target.result;

  // check if app is online, if yes run uploadTransaction() function to send all local db data to api
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function(e) {
  // log error here
  console.log(e.target.errorCode);
};

function saveTransaction(ledger) {
  // open a new transaction with r/w perms
  const transaction = db.transaction(['NewTransaction'], 'readwrite');

  // access the object store for 'NewTransaction'
  const transactionObjectStore = transaction.objectStore('NewTransaction');

  // add record to store
  transactionObjectStore.add(ledger);
}

function uploadTransaction() {
  const transaction = db.transaction(['NewTransaction'], 'readwrite');

  const transactionObjectStore = transaction.objectStore('NewTransaction');

  // get all records from the db 
  const getAll = transactionObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['NewTransaction'], 'readwrite');
          // access the new_pizza object store
          const transactionObjectStore = transaction.objectStore('NewTransaction');
          // clear all items in your store
          transactionObjectStore.clear();

          alert('All saved transactions has been submitted!');
        })
      .catch(err => {
        console.log(err);
      });
    }
  };
}

window.addEventListener('online', uploadTransaction);
