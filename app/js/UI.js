/**
 * UI
 */
"use strict";

var UI = function( App ) {

    var scope = this;

    scope.Contract = App.Contract;

    scope.NotePicker = new EM.NotePicker();
    scope.Sequencer = new EM.Sequencer();

    scope.NotePicker.setRequired( false );
    scope.Sequencer.setRequired( true );

    scope.currentEditor = scope.Sequencer;

    scope.init();

};

UI.prototype = {

    /**
     * Contract API
     */

    Contract: null,


    /**
     * Music writing
     */

    NotePicker: null,
    Sequencer: null,

    currentEditor: null,

    templater: null,


    /**
     * Page naviagtion
     */

    splashId: "splash",
    splashDiv: null,

    creatorId: "creator",
    creatorDiv: null,

    exploreId: "explore",
    exploreDiv: null,

    composersId: "composers",
    composersDiv: null,

    profileId: "profile",
    profileDiv: null,

    jingleId: "jingle",
    jingleDiv: null,

    currentPage: null,

    pages: {},
    pageMethods: {},

    templates: [
        "jingle.html",
        "profile.html"
    ],


    /**
     * Main setup
     */

    init: function() {

        var scope = this;

        scope.splashDiv = document.getElementById( scope.splashId );
        scope.creatorDiv = document.getElementById( scope.creatorId );
        scope.exploreDiv = document.getElementById( scope.exploreId );
        scope.composersDiv = document.getElementById( scope.composersId );
        scope.profileDiv = document.getElementById( scope.profileId );
        scope.jingleDiv = document.getElementById( scope.jingleId );

        scope.creatorDiv.style.display = "none";
        scope.exploreDiv.style.display = "none";
        scope.composersDiv.style.display = "none";
        scope.profileDiv.style.display = "none";
        scope.jingleDiv.style.display = "none";

        scope.currentPage = scope.splashDiv;

        scope.pages = {
            "create": scope.creatorDiv,
            "splash": scope.splashDiv,
            "explore": scope.exploreDiv,
            "composers": scope.composersDiv,
            "profile": scope.profileDiv,
            "jingle": scope.jingleDiv,
        };

        scope.pageMethods = {
            "jingle": scope.showJingle
        };

        scope.templater = new Templater({
            templates: scope.templates
        });

        scope.templater.compile( function() {

            scope.setupProfile();

        });

    },

    /**
     * Setup UI header
     */

    setupHeader: function( accounts ) {

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
     * Profile page setup
     */

    setupProfile: function() {

        var scope = this;

        var acct = web3.eth.accounts[ 0 ];

        scope.Contract.getAccount( acct, function( account ) {

            var vars = {
                account: account
            };

            scope.templater.render( "profile.html", vars, function( template ) {

                scope.profileDiv.innerHTML = template;

            });

        });

    },


    /**
     * Page shower
     */

    showPage: function( page, args ) {

        var scope = this;

        if( scope.currentPage ) {

            scope.currentPage.style.display = "none";

        }

        var pageDiv = scope.pages[ page ];

        pageDiv.style.display = "";

        scope.currentPage = pageDiv;

        if( scope.pageMethods[ page ] ) {

            scope.pageMethods[ page ].bind( this )( args );

        }

    },


    /**
     * Jingle shower
     */

    showJingle: function( id ) {

        var scope = this;

        scope.Contract.getJingle( id, function( jingle ) {

            var vars = {
                jingle: jingle
            };

            scope.templater.render( "jingle.html", vars, function( template ) {

                scope.jingleDiv.innerHTML = template;

            });

        });

    }

};
