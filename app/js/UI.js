/**
 * UI
 */
"use strict";

import { NotePicker } from './NotePicker.js';
import { Sequencer } from './Sequencer.js';
import { Templater } from './Utils/Templater.js';
import { Networks } from './Networks.js';
import { ABCHelper } from './ABCHelper.js';

var UI = function( App ) {

    var scope = this;

    scope.Contract = App.Contract;

    scope.Sequencer = new Sequencer();

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

    createForm: null,
    createFormId: "create-form",

    currentPage: null,

    pages: {},
    pageMethods: {},

    templates: [
        "jingle.html",
        "profile.html",
        "explore-view.html"
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

        scope.createForm = document.getElementById( scope.createFormId );

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
            scope.setupCreator();
            scope.setupExplore();

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
     * Setup jingle creator
     */

    setupCreator: function() {

        var scope = this;

        var priceInput = document.getElementById( "creator-price" );

        //Main submit

        scope.createForm.onsubmit = function( e ) {

            e.preventDefault();

            var args = scope.currentEditor.getArgs();

            if( ! args.pitches.length ) {

                return alert( "No beats created. Please add some music before submitting" );

            }

            args.price = web3.toWei( priceInput.value, "ether" );


            //Launch contract call

            scope.Contract.create( args, function() {

                alert( "CREATED JINGLE" );

            });

        };

        updateCreatorView();

        function updateCreatorView() {

            scope.updateCreatorView();

        }

        //Events

        scope.Sequencer.on( "change", updateCreatorView );

    },


    /**
     * ABC View for creator
     */

    updateCreatorView: function() {

        var scope = this;

        var creatorView = document.getElementById( "note-creator-view" );
        var listenView = document.getElementById( "note-creator-listen" );

        var beats = scope.currentEditor.getABC();

        if( ! beats || ! beats.length ) {

            creatorView.innerHTML = "";
            return;

        }

        var abc = ABCHelper.convertArrayToABC( beats );
        abc = "X: 1\n" +
            "K: C\n" +
            "L: 1/32\n" +
            ":" + abc;

        var midiOpts = {
            inlineControls: {
                startPlaying: true
            }
        };

        ABCJS.renderAbc( creatorView, abc );
        var midiRender = ABCJS.renderMidi( listenView, abc, midiOpts, midiOpts );

    },


    /**
     * Explorer
     */

    setupExplore: function() {

        var scope = this;

        scope.Contract.getJingles( function( jingles ) {

            console.log( jingles );

            var div = document.getElementById( "piece-explore" );

            var vars = {
                jingles: Object.values( jingles )
            };

            scope.templater.render( "explore-view.html", vars, function( template ) {

                div.innerHTML = template;

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

export { UI };
