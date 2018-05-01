/**
 * UI
 */
"use strict";

var UI = function() {

    var scope = this;

    scope.init();

};

UI.prototype = {

    splashId: "splash",
    splashDiv: null,

    creatorId: "creator",
    creatorDiv: null,

    currentPage: null,

    pages: {},


    /**
     * Main setup
     */

    init: function() {

        var scope = this;

        scope.splashDiv = document.getElementById( scope.splashId );
        scope.creatorDiv = document.getElementById( scope.creatorId );

        scope.creatorDiv.style.display = "none";

        scope.currentPage = scope.splashDiv;

        scope.pages = {
            "create": scope.creatorDiv,
            "splash": scope.splashDiv
        };

    },

    /**
     * Setup UI header
     */

    setupHeader: function( accounts ) {

        console.log( accounts );

        var addr = ( ! accounts || ! accounts.length )
            ? "Not Logged In"
            : accounts[ 0 ];

        var addrDom = document.getElementById( "address-section" );
        addrDom.innerHTML = addr;

        var network = web3.version.network;

        var netName = Networks[ network ] || "Unknown";

        var netDom = document.getElementById( "network-section" );
        netDom.innerHTML = netName;

    },


    /**
     * Page shower
     */

    showPage: function( page ) {

        var scope = this;

        if( scope.currentPage ) {

            scope.currentPage.style.display = "none";

        }

        var page = scope.pages[ page ];

        page.style.display = "";

        scope.currentPage = page;

    }

};
