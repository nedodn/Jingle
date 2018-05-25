/**
 * Contract calls API
 */
"use strict";

import { default as async } from "async";
import { default as contract } from "truffle-contract";

import { Utils } from "./Utils/Utils.js"

import motif_artifacts from '../../build/contracts/Motif.json';
import motifproxy_artifacts from '../../build/contracts/Motif.json'

var Contract = function() {

    var scope = this;

    var COMPOSITION_FEE = web3.toWei( 0.01, "ether" );

    var JingleContract = contract( motif_artifacts );

    JingleContract.setProvider(web3.currentProvider);

    var proxyAddress = '0x56253f1dc207e864ebac7315dcbddddb50530e35';

    scope.loadedJingles = {};


    /**
     * Contract API
     */

    scope.getAccount = function( addr, callback ) {

        JingleContract.at(proxyAddress).then((jingleInstance) => {

            jingleInstance.tokensOf.call( addr ).then((jingles) => {

                var cleanJingles = [];

                async.eachSeries( jingles, function( item, itemCallback ) {

                    scope.getJingle( item.toNumber(), function( jingle ) {

                        cleanJingles.push( jingle );

                        itemCallback();

                    });

                }, function() {

                    var account = {
                        address: addr,
                        name: "Not Implemented",
                        jingles: cleanJingles
                    };

                    callback( account );

                });

            });
        });
    };

    scope.getJingles = function( callback ) {

        JingleContract.at(proxyAddress).then((jingleInstance) => {

            jingleInstance.totalSupply.call().then((total) => {

                var jingles = Utils.createRange( 1, total.toNumber() );

                async.eachSeries( jingles, function( item, itemCallback ) {

                    scope.getJingle( item, function( jingle ) {

                        itemCallback();

                    });

                }, function() {

                    callback( scope.loadedJingles );

                });

            })

        });

    };

    scope.getJingle = function( id, callback ) {

        if( scope.loadedJingles[ id ] ) {

            return callback( scope.loadedJingles[ id ] );

        }

        JingleContract.at(proxyAddress).then((jingleInstance) => {

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

                        scope.loadedJingles[ id ] = jingle

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

        JingleContract.at(proxyAddress).then((jingleInstance) => {

            console.log( data );

            jingleInstance.composeBaseMelody(
                data.pitches,
                data.startTimes,
                data.durations,
                data.price,
                trans
            ).then((result) => {

                callback( result );

            });
        });

    };

};

export { Contract };
