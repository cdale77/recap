const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const RECAP_PATH = "chrome://recap/content/";

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

var Recap = {}; // Extension Namespace
	
var jsLoader = Cc["@mozilla.org/moz/jssubscript-loader;1"]
                .getService(Ci.mozIJSSubScriptLoader);

jsLoader.loadSubScript(RECAP_PATH + "RequestObserver.js", Recap);

function log(text) {
    var msg = "Recap: " + text + "\n";
    
    dump(msg);
    
    var consoleService = Cc["@mozilla.org/consoleservice;1"]
                          .getService(Ci.nsIConsoleService);
    consoleService.logStringMessage(msg);
}

log("recap.js loaded");

function RecapService() {
	// constructor
}

RecapService.prototype = {
    initialized: false,
	
    _init: function() {
	if(!this.initialized) {
	    var os = Cc["@mozilla.org/observer-service;1"].
	    getService(Ci.nsIObserverService);
	    os.addObserver(this, "xpcom-shutdown", false);
	    os.addObserver(this, "quit-application", false);
	    
            Recap.gRequestObserver = new Recap.RequestObserver();
	    
	    this.initialized = true;
	}
    },
	
    _shutdown: function() {
        os.removeObserver(this, "xpcom-shutdown");
	
	if(this.initialized) {
	    Recap.gRequestObserver.unregister();
            Recap.gRequestObserver = null;
	}
    },
    
    _quit: function() {
        os.removeObserver(this, "quit-application");
    },
    
    /************************************************************************
	Setting up and Registering the extension using XPCOMUtil
    ************************************************************************/

    // properties required for XPCOM registration:
    classDescription: "Recap",
    classID:          Components.ID("{dffa98a7-dd57-4859-a3f8-0a4288c43ede}"),
    contractID:       "@cs.princeton.edu/recap;1",
    QueryInterface: XPCOMUtils.generateQI([Ci.nsIObserver,
					   Ci.nsISupports]),
		 
    /**
     * See nsIObserver
     */
    observe: function Recap_observe(subject, topic, data) {
	var os = Cc["@mozilla.org/observer-service;1"].
	getService(Ci.nsIObserverService);
	
	switch (topic) {
	case "app-startup":
	    log("startup observed");
	    this._init();
	    break;
	case "xpcom-shutdown":
	    log("shutdown observed");
	    this._shutdown();
	    break;
	case "quit-application":
	    log("quit observed");
	    this._quit();
	    break;
	}
	
	os = null;
    },
  
    /**
     * See nsIFactory
     */
    //keep _instance and only return one instance of Recap
    _xpcom_factory: {
	_instance: null,
	createInstance: function (outer, iid) {
	    if (outer != null)
		throw Cr.NS_ERROR_NO_AGGREGATION;
	    log("createInstance called");
	    return this._instance == null ? 
  	      this._instance = (new RecapService()).QueryInterface(iid) : 
	      (this._instance).QueryInterface(iid);
	}
    },
		
    _xpcom_categories: [{
	    category: "app-startup",
	    service: true
	}]	
};

function NSGetModule(compMgr, fileSpec) 
    XPCOMUtils.generateModule([RecapService]);

