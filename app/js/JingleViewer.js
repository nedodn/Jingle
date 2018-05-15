/**
 * Jingle viewer
 */
"use strict";

import { ABCHelper } from './ABCHelper.js';
import { Midi } from './Midi.js';


var JingleViewer = function( dom, templater ) {

    var scope = this;

    scope.domElement = dom;

    scope.templater = templater;

};

JingleViewer.prototype = {

    domElement: null,

    templater: null,

    transposition: -40,

    display: function( jingle ) {

        var scope = this;

        var vars = {
            jingle: jingle
        };

        scope.templater.render( "jingle.html", vars, function( template ) {

            scope.domElement.innerHTML = template;

            scope.setJingleEvents();

            scope.renderABCJingle( jingle, scope.transposition );

        });

    },

    setJingleEvents: function() {

        var scope = this;

    },


    /**
     * Render abc to view
     */

    renderABCJingle: function( jingle, transposition ) {

        var scope = this;

        var renderArea = scope.domElement.getElementsByClassName( "jingle-abc-view" );
        renderArea = renderArea[ 0 ];

        var midiArea = scope.domElement.getElementsByClassName( "jingle-abc-midi" );
        midiArea = midiArea[ 0 ];

        var beats = [];
        var beat;

        var pl = jingle.pitches.length;

        var startingPos = 0;

        for( var i = 0; i < pl; ++ i ) {

            var pitch = jingle.pitches[ i ].toNumber();
            pitch += transposition;
            pitch = Math.max( pitch, 30 );

            var startTime = jingle.startTimes[ i ].toNumber();
            var duration = jingle.durations[ i ].toNumber();

            if( startingPos != startTime ) {

                beats.push( beat );

            }

            if( startingPos != startTime || ! beat ) {

                beat = {
                    notes: [],
                    length: Midi.PrecisionToLength[ duration ]
                };

                startingPos = startTime;

            }

            beat.notes.push( pitch );

        }

        beats.push( beat );

        console.log( beats );

        var abc = ABCHelper.convertArrayToABC( beats );
        abc = "X: 1\n" +
            "K: C\n" +
            "L: 1/32\n" +
            ":" + abc;

        var midiOpts = {};

        ABCJS.renderAbc( renderArea, abc );
        ABCJS.renderMidi( midiArea, abc, midiOpts, midiOpts );

    }

};

export { JingleViewer };
