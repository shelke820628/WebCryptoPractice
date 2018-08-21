async function encryptDataSaveKey() {
	var data = await makeData();
	console.log("generated data", data);
	var keys = await makeKeys()

 	window.crypto.subtle.exportKey(
       	"spki", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
       	keys.publicKey //can be a publicKey or privateKey, as long as extractable was true
    	).then(function(keydata)
    	{
        	// this always prints something like "A21ixmVqdCBccnOheQJ1cmNlcl0="
        	// I would expect it to print different string on each reload!
			console.log("PublicKey", buf2hex(keydata));
			console.log("PublicKey", keydata);
			alert("PublicKey");
			alert(buf2hex(keydata));
    	}).catch(function(err){
    		console.error(err);
	})

	window.crypto.subtle.exportKey(
       	"pkcs8", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
       	keys.privateKey //can be a publicKey or privateKey, as long as extractable was true
    	).then(function(keydata)
    	{
        	// this always prints something like "A21ixmVqdCBccnOheQJ1cmNlcl0="
        	// I would expect it to print different string on each reload!
        	console.log("privateKey", buf2hex(keydata));
			console.log("privateKey", keydata);
			alert("PrivateKey");
			alert(buf2hex(keydata));
    	}).catch(function(err){
    		console.error(err);
	})

	// test persistent storage
	if (navigator.storage && navigator.storage.persist)
  		navigator.storage.persist().then(granted => {
    	if (granted)
      		alert("Storage will not be cleared except by explicit user action");
    	else
      		alert("Storage may be cleared by the UA under storage pressure.");
  	});

	// call persist storage, https://developers.google.com/web/updates/2016/06/persistent-storage?hl=en
	// it seems not working
	console.log("persistent", persist());
	console.log("showEstimatedQuota", showEstimatedQuota());

	// chrome filesystem
	/*navigator.webkitPersistentStorage.queryUsageAndQuota(function (usage, quota) {
	        console.log('PERSISTENT: ' + usage + '/' + quota + ' - ' + usage / quota + '%');
   	 }
	);
	navigator.webkitPersistentStorage.requestQuota(2 * 1024 * 1024,
    		function (grantedBytes) {
        		window.webkitRequestFileSystem(window.PERSISTENT, grantedBytes,
            		function (fs) {
                		window.fs = fs;
            		});
    		}
	);
	save(keys.privateKey);*/
	

	//initStoragePersistence(); 
	//console.log("persist", persist());
	console.log("privateKey localStorage", localStorage.getItem('PrivateKey'));
	console.log("PublicKey localStorage", localStorage.getItem('PublicKey'));

	localStorage.setItem('PrivateKey', keys.privateKey);
	localStorage.setItem('PublicKey', keys.publicKey);

	

 	console.log("privateKey localStorage", localStorage.getItem('PrivateKey'));
	console.log("PublicKey localStorage", localStorage.getItem('PublicKey'));

	/*var getPrivateKey;
	restore(getPrivateKey)*/

	var encrypted = await encrypt(data, keys);
	callOnStore(function (store) {
		store.put({id: 1, keys: keys, encrypted: encrypted});
	})
}

function loadKeyDecryptData() {
	callOnStore(function (store) {
    var getData = store.get(1);
    getData.onsuccess = async function() {
    	var keys = getData.result.keys;
	
	window.crypto.subtle.exportKey(
       	"spki", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
       	keys.publicKey //can be a publicKey or privateKey, as long as extractable was true
    	).then(function(keydata)
    	{
        	// this always prints something like "A21ixmVqdCBccnOheQJ1cmNlcl0="
        	// I would expect it to print different string on each reload!
        	console.log("PublicKey", buf2hex(keydata));
			console.log("PublicKey", keydata);
    	}).catch(function(err){
    		console.error(err);
	})

	window.crypto.subtle.exportKey(
       	"pkcs8", //can be "jwk" (public or private), "spki" (public only), or "pkcs8" (private only)
       	keys.privateKey //can be a publicKey or privateKey, as long as extractable was true
    	).then(function(keydata)
    	{
        	// this always prints something like "A21ixmVqdCBccnOheQJ1cmNlcl0="
        	// I would expect it to print different string on each reload!
        	console.log("privateKey", buf2hex(keydata));
		console.log("privateKey", keydata);
    	}).catch(function(err){
    		console.error(err);
	})

	alert("OK");
      var encrypted = getData.result.encrypted;
			var data = await decrypt(encrypted, keys);
			console.log("decrypted data", data);
	   };
	})
}

function callOnStore(fn_) {

	// This works on all devices/browsers, and uses IndexedDBShim as a final fallback 
	var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

	// Open (or create) the database
	var open = indexedDB.open("MyDatabase", 1);

	// Create the schema
	open.onupgradeneeded = function() {
	    var db = open.result;
	    var store = db.createObjectStore("MyObjectStore", {keyPath: "id"});
	};


	open.onsuccess = function() {
	    // Start a new transaction
	    var db = open.result;
	    var tx = db.transaction("MyObjectStore", "readwrite");
	    var store = tx.objectStore("MyObjectStore");

	    fn_(store)


	    // Close the db when the transaction is done
	    tx.oncomplete = function() {
	        db.close();
	    };
	}
}

async function encryptDecrypt() {
	var data = await makeData();
	console.log("generated data", data);
	var keys = await makeKeys()
	var encrypted = await encrypt(data, keys);
	console.log("encrypted", encrypted);
	var finalData = await decrypt(encrypted, keys);
	console.log("decrypted data", data);
}





function makeData() {
	return window.crypto.getRandomValues(new Uint8Array(16))
}

function makeKeys() {
	return window.crypto.subtle.generateKey(
    {
        name: "RSA-OAEP",
        modulusLength: 2048, //can be 1024, 2048, or 4096
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
    },
    true, //whether the key is extractable (i.e. can be used in exportKey)
    ["encrypt", "decrypt"] //must be ["encrypt", "decrypt"] or ["wrapKey", "unwrapKey"]
   )
}

function encrypt(data, keys) {
	return window.crypto.subtle.encrypt(
    {
        name: "RSA-OAEP",
        //label: Uint8Array([...]) //optional
    },
    keys.publicKey, //from generateKey or importKey above
    data //ArrayBuffer of data you want to encrypt
)
}


async function decrypt(data, keys) {
	return new Uint8Array(await window.crypto.subtle.decrypt(
	    {
	        name: "RSA-OAEP",
	        //label: Uint8Array([...]) //optional
	    },
	    keys.privateKey, //from generateKey or importKey above
	    data //ArrayBuffer of the data
	));
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}



// persistStorageAPi
// https://storage.spec.whatwg.org/#ui-guidelines

/** Check if storage is persisted already.
  @returns {Promise<boolean>} Promise resolved with true if current origin is
  using persistent storage, false if not, and undefined if the API is not
  present.
*/
async function isStoragePersisted() {
  return await navigator.storage && navigator.storage.persisted ?
    navigator.storage.persisted() :
    undefined;
}

/** Tries to convert to persisted storage.
  @returns {Promise<boolean>} Promise resolved with true if successfully
  persisted the storage, false if not, and undefined if the API is not present.
*/
async function persist() {
  return await navigator.storage && navigator.storage.persist ?
    navigator.storage.persist() :
    undefined;
}

/** Queries available disk quota.
  @see https://developer.mozilla.org/en-US/docs/Web/API/StorageEstimate
  @returns {Promise<{quota: number, usage: number}>} Promise resolved with
  {quota: number, usage: number} or undefined.
*/
async function showEstimatedQuota() {
  return await navigator.storage && navigator.storage.estimate ?
    navigator.storage.estimate() :
    undefined;
}

/** Tries to persist storage without ever prompting user.
  @returns {Promise<string>}
    "never" In case persisting is not ever possible. Caller don't bother
      asking user for permission.
    "prompt" In case persisting would be possible if prompting user first.
    "persisted" In case this call successfully silently persisted the storage,
      or if it was already persisted.
*/
async function tryPersistWithoutPromtingUser() {
  if (!navigator.storage || !navigator.storage.persisted) {
    return "never";
  }
  let persisted = await navigator.storage.persisted();
  if (persisted) {
    return "persisted";
  }
  if (!navigator.permissions || !navigator.permissions.query) {
    return "prompt"; // It MAY be successful to prompt. Don't know.
  }
  const permission = await navigator.permissions.query({name:'persistent-storage'}).then(function(result) {
 	if (result.state == 'granted') {
   		persisted = /*await*/ navigator.storage.persist();
    		if (persisted) {
      			return "persisted";
    		} else {
      			throw new Error("Failed to persist");
    		}
 	} else if (result.state == 'prompt') {
  		return "prompt";
 	}
 	// Don't do anything if the permission was denied.
	});
  //if (permission.status === "granted") {
    //persisted = await navigator.storage.persist();
    //if (persisted) {
   //   return "persisted";
   // } else {
   //   throw new Error("Failed to persist");
   // }
 // }
  if (permission.status === "prompt") {
    return "prompt";
  }
  return "never";
}

async function initStoragePersistence() {
  const persist = await tryPersistWithoutPromtingUser();
  switch (persist) {
    case "never":
      console.log("Not possible to persist storage");
      break;
    case "persisted":
      console.log("Successfully persisted storage silently");
      break;
    case "prompt":
      console.log("Not persisted, but we may prompt user when we want to.");
      break;
  }
}

// filesystem
function save(dataModel) {
    var value = dataModel.serialize();
    fs.root.getFile('keys.txt', {create: true}, function (fileEntry) {
        console.log(fileEntry.toURL());
        fileEntry.createWriter(function (fileWriter) {
            fileWriter.onwriteend = function () {
                console.log(dataModel.size() + ' datas are saved');
            };
            var blob = new Blob([value], {type: 'text/plain'});
            fileWriter.write(blob);
        });
    });
    return value;
}
function restore(dataModel) {
    fs.root.getFile('keys.txt', {}, function (fileEntry) {
        fileEntry.file(function (file) {
            var reader = new FileReader();
            reader.onloadend = function (e) {
                dataModel.clear();
                dataModel.deserialize(reader.result);
                console.log(dataModel.size() + ' datas are restored');
            };
            reader.readAsText(file);
        });
    });
    return '';
}
function clear() {
    fs.root.getFile('keys.txt', {create: false}, function(fileEntry) {
        fileEntry.remove(function() {
            console.log(fileEntry.toURL() + ' is removed');
        });
    });    
}



