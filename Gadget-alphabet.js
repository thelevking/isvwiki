/*
 * Medžuviki transliterator
 * Converts visible content in Latin or Cyrillic
 * 
 * Borrows from: https://www.mediawiki.org/wiki/MediaWiki:Gadget-Numerakri.js
 * @license <https://opensource.org/licenses/MIT>
 */
(function () {
	var config = mw.config.get([
		'wgAction',
		'wgContentLanguage',
		'wgNamespaceNumber',
		'wgTitle',
		'wgUserName',
		'skin'
	]);
	if (
		config.wgAction !== 'view'
		|| (
			config.wgNamespaceNumber !== 0
			&& config.wgNamespaceNumber !== 1658
			&& $( '.ext-gadget-alphabet-enable' ).length === 0
		)
	) return false;
	
	/**
	 * Replacements (for Latin as a default)
	 * Syntax: ["Latin", "Cyrillic"],
	 * Put additional conversions of same letters after the main one
	 */
	var data = {
		outliers: [
			// Use acutes for disambiguation purposes in Cyrillic
			['lj', 'љ'],
			// ['ĺj', 'лј'],
			['nj', 'њ'],
			// ['ńj', 'нј']
		],
		mappings: [
			['a', 'а'],
			['b', 'б'],
			['c', 'ц'],
			['č', 'ч'],
			['d', 'д'],
			['e', 'е'],
			['ě', 'є'],
			['f', 'ф'],
			['g', 'г'],
			['h', 'х'],
			['i', 'и'],
			['j', 'ј'],
			['k', 'к'],
			['l', 'л'],
			['ĺ', 'л'],
			['m', 'м'],
			['n', 'н'],
			['ń', 'н'],
			['o', 'о'],
			['p', 'п'],
			['r', 'р'],
			['s', 'с'],
			['š', 'ш'],
			['t', 'т'],
			['u', 'у'],
			['v', 'в'],
			['y', 'ы'],
			['z', 'з'],
			['ž', 'ж'],
			
			// Optional (Extended) Interslavic, do not use in text preferably
			['å', 'а'],
			['ć', 'ч'],
			['ď', 'д'],
			['đ', 'дж'],
			['ė', 'е'],
			['ę', 'е'],
			['ľ', 'љ'],
			['ň', 'н'],
			['ò', 'о'],
			['ŕ', 'р'],
			['ř', 'р'],
			['ś', 'с'],
			['ť', 'т'],
			['ų', 'у'],
			['ź', 'з'],
			
			// Solely for Cyrillic to Latin conversions
			['šč', 'щ'],
			['j', 'ь'],
			['ja', 'я'],
			['ju', 'ю'],
			['e', 'э'],
			['e', 'ѣ'],
			
			// Non-used letters that can be good to have converted
			['w', 'в'],
			['x', 'кс']
		]
	};

	// Script data
	var walker = null;
	var targetStyle;
	var currentStyle = 'default';
	var api;
	var VAR_INDEX = {
		default: 0,
		latn: 0,
		cyrl: 1
	};
	var DEFAULTS_KEY = '_extGadgetAlphabet';
	var CLASS_DISABLE = 'ext-gadget-alphabet-disable';

	// HTML tags that should not be touched by parser
	var skippedTags = [
		'code',
		'input',
		'link',
		'kbd',
		'noscript',
		'pre',
		'style',
		'textarea'
	];

	/**
	 * Filter the text nodes for tree walker
	 *
	 * @param {HTMLElement|TextNode} node
	 * @return {number} NodeFilter.FILTER_* constant
	 */
	function filterNode( node ) {
		if ( node.nodeType === Node.TEXT_NODE ) {
			// Skip whitespace
			if ( !/\S/.test( node.nodeValue ) ) return NodeFilter.FILTER_REJECT;

			return NodeFilter.FILTER_ACCEPT;
		}

		// Skip this element and skip its children
		var tag = node.nodeName && node.nodeName.toLowerCase();
		if ( skippedTags.indexOf( tag ) > -1 ) return NodeFilter.FILTER_REJECT;

		var lang = $( node ).attr( 'lang' );
		var hasSkipClass = $( node ).hasClass( CLASS_DISABLE );
		if ( ( lang && lang !== config.wgContentLanguage ) || hasSkipClass ) {
			return NodeFilter.FILTER_REJECT;
		}

		// Skip this element, but check its children
		return NodeFilter.FILTER_SKIP;
	}

	/**
	 * Replace all the text in the filtered nodes
	 *
	 * @param {TextNode} node
	 */
	function handleTextNode( node ) {
		if ( targetStyle === 'default' ) {
			restoreDefaults( node );
			return;
		}
		var original = node.nodeValue;
		var changed = original;

		// Replace outliers first
		for ( var i = 0; i < data.outliers.length; i++ ) {
			changed = replaceSequence( changed, data.outliers[ i ] );
		}

		// Replace the letters
		for ( var i = 0; i < data.mappings.length; i++ ) {
			changed = replaceSequence( changed, data.mappings[ i ] );
		}

		storeDefaultValue( node, original, changed );
		if ( original !== changed ) {
			node.nodeValue = changed;
		}
	}

	/**
	 * Restore defaults in all nodes (if possible)
	 *
	 * @param {TextNode} node
	 */
	function restoreDefaults( node ) {
		var defaults = node.parentNode[ DEFAULTS_KEY ];
		var value = node.nodeValue;
		if ( typeof defaults !== 'object' || defaults === null ) {
			return;
		}

		if ( defaults[ value ] !== '' ) {
			node.nodeValue = defaults[ value ];
		}
	}

	/**
	 * Set defaults in the parent node
	 * 
	 * @param {TextNode} node
	 * @param {string} original
	 * @param {string} changed
	 */
	function storeDefaultValue( node, original, changed ) {
		var parent = node.parentNode;
		if ( typeof parent[ DEFAULTS_KEY ] !== 'object' || parent[ DEFAULTS_KEY ] === null ) {
			parent[ DEFAULTS_KEY ] = {};
		}

		if ( currentStyle === 'default' ) {
			parent[ DEFAULTS_KEY ][ changed ] = original;
			return;
		}

		// Get default value from previous conversion
		if ( original in parent[ DEFAULTS_KEY ] ) {
			parent[ DEFAULTS_KEY ][ changed ] = parent[ DEFAULTS_KEY ][ original ];
		}
	}

	/**
	 * Handling function for requestIdleCallback
	 * See https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw-method-requestIdleCallback
	 */
	function idleWalker( deadline ) {
		var el;
		if ( !walker ) {
			return;
		}
		while ( deadline.timeRemaining() > 0 ) {
			el = walker.nextNode();
			if ( !el ) {
				// Reached the end
				walker = null;
				currentStyle = targetStyle;
				targetStyle = null;

				return;
			}
			handleTextNode( el );
		}

		// The user may interact with the page. We pause so the browser can process
		// interaction. The text handler will continue after that.
		if ( walker ) {
			mw.requestIdleCallback( idleWalker );
		}
	}
	
	/**
	 * Transliterate the content into one of the options
	 *
	 * @param event The event or object: outputStyle ("cyrl", "latn"), trigger
	 * @returns Nothing (undefined)
	 */
	function startPageConversion( event ) {
		if ( event.trigger !== true ) {
			event.preventDefault();
		}
		targetStyle = event.data.outputStyle;

		// Nothing to change, just show the default page
		if ( event.trigger !== true && currentStyle === targetStyle ) {
			return;
		}
		
		// Change selected tab and save variant
		var $targetTab = $( '#ca-varlang-' + targetStyle );
		$( '[id^="ca-varlang"].selected' ).removeClass( 'selected' );
		$( $targetTab ).addClass( 'selected' );
		$( '#p-variants-label > span' ).text( $targetTab.text() );
		if ( event.trigger !== true ) {
			setVariant( targetStyle );
		}
		
		if ( event.trigger === true && targetStyle === 'default' ) {
			return;
		}
	
		// If a walker is already active, replace it.
		// If no walker is active yet, start it.
		if ( !walker ) {
			mw.requestIdleCallback( idleWalker );
		}
		walker = document.createTreeWalker(
			document.querySelector( '#mw-content-text' ),
			NodeFilter.SHOW_ALL,
			filterNode,
			false
		);
	}

	/**
	 * Replace occurrences of a letter sequence
	 *
	 * @param {TextNode} str
	 * @param {Array} data
	 * @return {TextNode}
	 */
	function replaceSequence( str, data ) {
		var input = data[ + !VAR_INDEX[ targetStyle ] ];
		var output = data[ VAR_INDEX[ targetStyle ] ];

		// Small function for uppercasing first letter only
		function capitalize( string ) {
			return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
		}

		var capInput = capitalize( input );
		var capOutput = capitalize( output );
		var uppInput = input.toUpperCase();

		if ( !String.prototype.replaceAll ) {
			return str.replace( new RegExp( input, 'g' ), output )
				.replace( new RegExp( capInput, g ), capOutput )
				.replace( new RegExp( input.toUpperCase(), g ), capOutput );
		}

		return str.replaceAll( input, output )
			.replaceAll( capInput, capOutput )
			.replaceAll( uppInput, capOutput );
	}
	
	/*
	 * Read user option / local storage for variant
	 * @return {string} Value from option / local storage or "default"
	 */
	function getVariant() {
		var value;
		if ( config.wgUserName === null ) {
			mw.loader.using( 'mediawiki.storage' ).done( function() {
				value = mw.storage.get( 'ext-gadget-alphabet' );
				value = ( value !== null ? value : 'default' );
			} );

			return value;
		}

		mw.loader.using( 'mediawiki.user' ).done( function() {
			value = mw.user.options.get( 'userjs-ext-gadget-alphabet' );
			value = ( value !== null ? value : 'default' );
		} );
		return value;
	}
	
	/*
	 * Set user option / cookie for variant
	 * @param name Possible values: "default", "latn", "cyrl"
	 * @returns Nothing (undefined)
	 */
	function setVariant( name ) {
		var isDefault = ( name === 'default' );
		var message = 'Vaše prědpočitańje azbuky bylo ' + ( isDefault ? 'udaljeno.' : 'zapisano.' );
		if ( config.wgUserName === null ) {
			mw.loader.using( 'mediawiki.storage' ).done( function() {
				var action = ( isDefault ? 'remove' : 'set' );

				var stored = mw.storage[ action ]( 'ext-gadget-alphabet', name );
				if ( stored ) mw.notify( message );
			} );

			return;
		}

		mw.loader.using( [ 'mediawiki.api', 'mediawiki.user' ] ).done( function() {
			var api = new mw.Api();
			var value = ( isDefault ? null : name );
			
			api.saveOption( 'userjs-ext-gadget-alphabet', value ).then( function() {
				mw.notify( message );
			} );
		} );
	}
	
	/*
	 * Add alphabet variants and start initial conversion.
	 */
	function init() {
		var isVector = ( config.skin === 'vector' );
		if ( isVector ) {
			$( '#p-variants' ).removeClass( 'emptyPortlet' );
			$( '#p-variants-label' ).addClass( CLASS_DISABLE );
		}

		// Create portlet links
		var labels = {
			'default': 'Lat./Кир.',
			'latn': 'Latinica',
			'cyrl': 'Кирилица'
		};
		
		function addPortletLink( code ) {
			var $link = $( mw.util.addPortletLink(
				( isVector ? 'p-variants' : 'p-cactions' ),
				'/wiki/Project:Pomoč/Transliteracija',
				labels[ code ],
				'ca-varlang-' + code
			) );

			var lang = config.wgContentLanguage + ( code !== 'default' ? '-' + code : '' );
			if ( code === 'default' ) $link.addClass( 'selected' );
			$link.attr( 'lang', lang ).addClass( CLASS_DISABLE );
			$link.find( 'a' ).click( { 'outputStyle': code }, startPageConversion );
		}
		
		mw.loader.using( 'mediawiki.util' ).done(function() {
			addPortletLink( 'default' );
			addPortletLink( 'latn' );
			addPortletLink( 'cyrl' );
		} );

		// Start conversion when the document is idle
		var variant = getVariant();
		$( '#p-variants-label > span' ).text( labels[ variant ] );
		mw.requestIdleCallback( function() {
			startPageConversion( {
				data: {
					outputStyle: variant
				},
				trigger: true
			} );
		} );
	}

	$( init );
}() );
