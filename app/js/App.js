/**
 * Main app init
 */
"use strict";

import { Contract } from "./Contract.js"
import { UI } from "./UI.js"

import { Navigator } from "./Navigator.js"

var App = function() {

    var scope = this;

    scope.Contract = new Contract;

    scope.UI = new UI( scope );

    scope.Navigator = new Navigator( scope );

    //Check if even installed

    if( typeof( Web3 ) === "undefined" && typeof( web3 ) === "undefined" ) {

        alert( "MetaMask or Web3 enabled browser not installed, please install at http://metamask.io" );

        return;

    }

    // Check if logged in

    web3.eth.getAccounts( function( err, accounts ) {

        console.log("TEST");

        scope.UI.setupHeader( accounts );

    });

};
