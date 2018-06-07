/**
 * Contract calls API
 */
"use strict";

import { default as async } from "async";
import { default as contract } from "truffle-contract";

import { Utils } from "./Utils/Utils.js"
import { EventDispatcher } from "./Utils/EventDispatcher.js"

import motif_artifacts from '../../build/contracts/Motif.json';
import motifproxy_artifacts from '../../build/contracts/Motif.json'

var Contract = function() {

    var scope = this;

    var COMPOSITION_FEE = web3.toWei( 0.01, "ether" );

    var JingleContract = contract( motif_artifacts );

    JingleContract.setProvider(web3.currentProvider);

    var jingleInstance = null;

    var proxyAddress = '0x56253f1dc207e864ebac7315dcbddddb50530e35';

    scope.loadedJingles = null;

    //Hack to get tokensOf in
    //@TODO use contract calls legit

    scope.tokensOf = {};


    /**
     * Load deployed
     * @TODO
     */

    scope.load = function() {

        JingleContract.at(proxyAddress).then((ji) => {

            jingleInstance = ji;

            scope.getJingles(function() {

                scope.dispatch({ type: "load" });

            });

        });

    };


    /**
     * Contract API
     * @TODO use solidity funcs ERC721
     */

    scope.getAccount = function( addr, callback ) {

        var jingles = scope.tokensOf[ addr ] || [];

        var account = {
            address: addr,
            name: "Not Implemented",
            jingles: jingles
        };

        callback( account );

    };


    /**
     * Load or get all jingle
     */

    scope.getJingles = function( callback ) {

        if( scope.loadedJingles !== null ) {

            callback( scope.loadedJingles );
            return;

        }

        scope.loadedJingles = {};

        jingleInstance.totalSupply.call().then((total) => {

            var jingles = Utils.createRange( 1, total.toNumber() );

            async.eachSeries( jingles, function( item, itemCallback ) {

                scope.getJingle( item, function( jingle ) {

                    itemCallback();

                });

            }, function() {

                callback( scope.loadedJingles );

            });

        });

    };

    scope.getJingle = function( id, callback ) {

        if( scope.loadedJingles[ id ] ) {

            return callback( scope.loadedJingles[ id ] );

        }

        jingleInstance.getMelody.call( id ).then((data) => {

            jingleInstance.ownerOf.call( id ).then((account) => {

                var jingle = {
                    id: id,
                    pitches: data[ 0 ],
                    startTimes: data[ 1 ],
                    durations: data[ 2 ],
                    price: data[ 3 ],
                    owner: account === web3.eth.accounts[ 0 ],
                    account: {
                        address: account
                    }
                };

                jingleInstance.getCompositionPrice.call( id ).then( (price) => {

                    jingle.price = web3.fromWei( price, "ether" );

                    jingleInstance.getTitle.call( id ).then( (title) => {

                        jingle.title = web3.toAscii( title );

                        scope.loadedJingles[ id ] = jingle

                        //Add to tokensOF

                        if( ! scope.tokensOf[ account ] ) {

                            scope.tokensOf[ account ] = [];

                        }

                        scope.tokensOf[ account ].push( jingle );

                        callback( scope.loadedJingles[ id ] );

                    });

                });


            });

        });

    };


    /**
     * Main create jingle
     */

    scope.create = function( data, callback ) {

        var trans = {
            value: COMPOSITION_FEE,
            from: web3.eth.accounts[ 0 ]
        };

        jingleInstance.composeBaseMelody(
            data.pitches,
            data.startTimes,
            data.durations,
            data.price,
            data.display,
            data.title,
            trans
        ).then((result) => {

            callback( result );

        });

    };


    //Extend from event dispatcher

    EventDispatcher.prototype.apply( scope );

};

export { Contract };
