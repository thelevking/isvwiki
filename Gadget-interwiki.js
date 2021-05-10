// <nowiki>
// Show Wikipedia interwiki links from Wikidata ID
// Use with [[d:Q1]]
// </nowiki>
var CACHE = {};
var WIKIDATA_LABEL = 'Element Vikidanyh';

function renderInterwikiList( data ) {
	if (!data) data = {};
	var $pLang = $( '#p-lang' );
	var $pLangList = ( $pLang.length > 0 ? $pLang.find( 'ul' ) : $( data.listSelector ) );
	var $wdItem = $( data.wikidataSelector || '.interwiki-d' );

	// Do not react twice
	if ( $pLangList.length === 0
		|| $wdItem.length === 0
		|| $wdItem.length > 1 ) {
		return;
	}

	// Check for Wikidata item ID
	var id = $wdItem.find( 'a' ).attr( 'href' ).match( /Q(\d+)$/g );
	id = ( id ? id[0] : null );
	if ( id === null ) return;

	// Setup public objects for gadget
	if ( typeof isv === 'undefined' ) window.isv = {};
	if ( typeof isv.interwiki === 'undefined' ) isv.interwiki = {};
	isv.interwiki.showAll = isv.interwiki.showAll || false;
	if ( data.showAll ) {
		isv.interwiki.showAll = true;
	}

	// Remember the number of links
	isv.interwiki.linkCount = 0;
	isv.interwiki.regularLinkCount = 0;

	// Suggested languages (English and Slavic languages)
	isv.interwiki.suggestedList = [
		'en',

		'bg',
		'be',
		'be-tarask', 'be-x-old',
		'bs',
		'cs',
		'csb',
		'cu',
		'dsb',
		'hr',
		'hsb',
		'mk',
		'pl',
		'ru',
		'rue',
		'sh',
		'sk',
		'sl',
		'sr',
		'szl',
		'uk'
	];

	// Update from https://intuition.toolforge.org/wpAvailableLanguages.js.php - Last update: Mon, 15 Mar 2021 12:11:30 +0000
	isv.interwiki.lang={"aa":"Qafár af","ab":"Аҧсшәа","abs":"bahasa ambon","ace":"Acèh","ady":"адыгабзэ","ady-cyrl":"адыгабзэ","aeb":"تونسي\/Tûnsî","aeb-arab":"تونسي","aeb-latn":"Tûnsî","af":"Afrikaans","ak":"Akan","aln":"Gegë","als":"Alemannisch","alt":"алтай тил","am":"አማርኛ","ami":"Pangcah","an":"aragonés","ang":"Ænglisc","anp":"अङ्गिका","ar":"العربية","arc":"ܐܪܡܝܐ","arn":"mapudungun","arq":"جازايرية","ary":"الدارجة","arz":"مصرى","as":"অসমীয়া","ase":"American sign language","ast":"asturianu","atj":"Atikamekw","av":"авар","avk":"Kotava","awa":"अवधी","ay":"Aymar aru","az":"azərbaycanca","azb":"تۆرکجه","ba":"башҡортса","ban":"Basa Bali","ban-bali":"ᬩᬲᬩᬮᬶ","bar":"Boarisch","bat-smg":"žemaitėška","bbc":"Batak Toba","bbc-latn":"Batak Toba","bcc":"جهلسری بلوچی","bcl":"Bikol Central","be":"беларуская","be-tarask":"беларуская (тарашкевіца)‎","be-x-old":"беларуская (тарашкевіца)‎","bg":"български","bgn":"روچ کپتین بلوچی","bh":"भोजपुरी","bho":"भोजपुरी","bi":"Bislama","bjn":"Banjar","bm":"bamanankan","bn":"বাংলা","bo":"བོད་ཡིག","bpy":"বিষ্ণুপ্রিয়া মণিপুরী","bqi":"بختیاری","br":"brezhoneg","brh":"Bráhuí","bs":"bosanski","btm":"Batak Mandailing","bto":"Iriga Bicolano","bug":"ᨅᨔ ᨕᨘᨁᨗ","bxr":"буряад","ca":"català","cbk-zam":"Chavacano de Zamboanga","cdo":"Mìng-dĕ̤ng-ngṳ̄","ce":"нохчийн","ceb":"Cebuano","ch":"Chamoru","cho":"Choctaw","chr":"ᏣᎳᎩ","chy":"Tsetsêhestâhese","ckb":"کوردی","co":"corsu","cps":"Capiceño","cr":"Nēhiyawēwin \/ ᓀᐦᐃᔭᐍᐏᐣ","crh":"qırımtatarca","crh-cyrl":"къырымтатарджа (Кирилл)‎","crh-latn":"qırımtatarca (Latin)‎","cs":"čeština","csb":"kaszëbsczi","cu":"словѣньскъ \/ ⰔⰎⰑⰂⰡⰐⰠⰔⰍⰟ","cv":"Чӑвашла","cy":"Cymraeg","da":"dansk","dag":"Dagbanli","de":"Deutsch","de-at":"Österreichisches Deutsch","de-ch":"Schweizer Hochdeutsch","de-formal":"Deutsch (Sie-Form)‎","din":"Thuɔŋjäŋ","diq":"Zazaki","dsb":"dolnoserbski","dtp":"Dusun Bundu-liwan","dty":"डोटेली","dv":"ދިވެހިބަސް","dz":"ཇོང་ཁ","ee":"eʋegbe","egl":"Emiliàn","el":"Ελληνικά","eml":"emiliàn e rumagnòl","en":"English","en-ca":"Canadian English","en-gb":"British English","eo":"Esperanto","es":"español","es-419":"español de América Latina","es-formal":"español (formal)‎","et":"eesti","eu":"euskara","ext":"estremeñu","fa":"فارسی","ff":"Fulfulde","fi":"suomi","fit":"meänkieli","fiu-vro":"võro","fj":"Na Vosa Vakaviti","fkv":"kvääni","fo":"føroyskt","fr":"français","frc":"français cadien","frp":"arpetan","frr":"Nordfriisk","fur":"furlan","fy":"Frysk","ga":"Gaeilge","gag":"Gagauz","gan":"贛語","gan-hans":"赣语（简体）‎","gan-hant":"贛語（繁體）‎","gcr":"kriyòl gwiyannen","gd":"Gàidhlig","gl":"galego","glk":"گیلکی","gn":"Avañe'ẽ","gom":"गोंयची कोंकणी \/ Gõychi Konknni","gom-deva":"गोंयची कोंकणी","gom-latn":"Gõychi Konknni","gor":"Bahasa Hulontalo","got":"\ud800\udf32\ud800\udf3f\ud800\udf44\ud800\udf39\ud800\udf43\ud800\udf3a","grc":"Ἀρχαία ἑλληνικὴ","gsw":"Alemannisch","gu":"ગુજરાતી","guc":"wayuunaiki","gv":"Gaelg","ha":"Hausa","hak":"客家語\/Hak-kâ-ngî","haw":"Hawaiʻi","he":"עברית","hi":"हिन्दी","hif":"Fiji Hindi","hif-latn":"Fiji Hindi","hil":"Ilonggo","ho":"Hiri Motu","hr":"hrvatski","hrx":"Hunsrik","hsb":"hornjoserbsce","ht":"Kreyòl ayisyen","hu":"magyar","hu-formal":"magyar (formal)‎","hy":"հայերեն","hyw":"Արեւմտահայերէն","hz":"Otsiherero","ia":"interlingua","id":"Bahasa Indonesia","ie":"Interlingue","ig":"Igbo","ii":"ꆇꉙ","ik":"Iñupiak","ike-cans":"ᐃᓄᒃᑎᑐᑦ","ike-latn":"inuktitut","ilo":"Ilokano","inh":"ГӀалгӀай","io":"Ido","is":"íslenska","it":"italiano","iu":"ᐃᓄᒃᑎᑐᑦ\/inuktitut","ja":"日本語","jam":"Patois","jbo":"la .lojban.","jut":"jysk","jv":"Jawa","ka":"ქართული","kaa":"Qaraqalpaqsha","kab":"Taqbaylit","kbd":"Адыгэбзэ","kbd-cyrl":"Адыгэбзэ","kbp":"Kabɩyɛ","kcg":"Tyap","kea":"Kabuverdianu","kg":"Kongo","khw":"کھوار","ki":"Gĩkũyũ","kiu":"Kırmancki","kj":"Kwanyama","kjp":"ဖၠုံလိက်","kk":"қазақша","kk-arab":"قازاقشا (تٴوتە)‏","kk-cn":"قازاقشا (جۇنگو)‏","kk-cyrl":"қазақша (кирил)‎","kk-kz":"қазақша (Қазақстан)‎","kk-latn":"qazaqşa (latın)‎","kk-tr":"qazaqşa (Türkïya)‎","kl":"kalaallisut","km":"ភាសាខ្មែរ","kn":"ಕನ್ನಡ","ko":"한국어","ko-kp":"조선말","koi":"перем коми","kr":"Kanuri","krc":"къарачай-малкъар","kri":"Krio","krj":"Kinaray-a","krl":"karjal","ks":"कॉशुर \/ کٲشُر","ks-arab":"کٲشُر","ks-deva":"कॉशुर","ksh":"Ripoarisch","ku":"kurdî","ku-arab":"كوردي (عەرەبی)‏","ku-latn":"kurdî (latînî)‎","kum":"къумукъ","kv":"коми","kw":"kernowek","ky":"Кыргызча","la":"Latina","lad":"Ladino","lb":"Lëtzebuergesch","lbe":"лакку","lez":"лезги","lfn":"Lingua Franca Nova","lg":"Luganda","li":"Limburgs","lij":"Ligure","liv":"Līvõ kēļ","lki":"لەکی","lld":"Ladin","lmo":"lumbaart","ln":"lingála","lo":"ລາວ","loz":"Silozi","lrc":"لۊری شومالی","lt":"lietuvių","ltg":"latgaļu","lus":"Mizo ţawng","luz":"لئری دوٙمینی","lv":"latviešu","lzh":"文言","lzz":"Lazuri","mad":"Madhurâ","mai":"मैथिली","map-bms":"Basa Banyumasan","mdf":"мокшень","mg":"Malagasy","mh":"Ebon","mhr":"олык марий","mi":"Māori","min":"Minangkabau","mk":"македонски","ml":"മലയാളം","mn":"монгол","mni":"ꯃꯤꯇꯩ ꯂꯣꯟ","mnw":"ဘာသာ မန်","mo":"молдовеняскэ","mr":"मराठी","mrh":"Mara","mrj":"кырык мары","ms":"Bahasa Melayu","mt":"Malti","mus":"Mvskoke","mwl":"Mirandés","my":"မြန်မာဘာသာ","myv":"эрзянь","mzn":"مازِرونی","na":"Dorerin Naoero","nah":"Nāhuatl","nan":"Bân-lâm-gú","nap":"Napulitano","nb":"norsk bokmål","nds":"Plattdüütsch","nds-nl":"Nedersaksies","ne":"नेपाली","new":"नेपाल भाषा","ng":"Oshiwambo","nia":"Li Niha","niu":"Niuē","nl":"Nederlands","nl-informal":"Nederlands (informeel)‎","nn":"norsk nynorsk","no":"norsk","nod":"ᨣᩴᩤᨾᩮᩥᩬᨦ","nov":"Novial","nqo":"ߒߞߏ","nrm":"Nouormand","nso":"Sesotho sa Leboa","nv":"Diné bizaad","ny":"Chi-Chewa","nys":"Nyunga","oc":"occitan","olo":"livvinkarjala","om":"Oromoo","or":"ଓଡ଼ିଆ","os":"Ирон","ota":"لسان توركى","pa":"ਪੰਜਾਬੀ","pag":"Pangasinan","pam":"Kapampangan","pap":"Papiamentu","pcd":"Picard","pdc":"Deitsch","pdt":"Plautdietsch","pfl":"Pälzisch","pi":"पालि","pih":"Norfuk \/ Pitkern","pl":"polski","pms":"Piemontèis","pnb":"پنجابی","pnt":"Ποντιακά","prg":"Prūsiskan","ps":"پښتو","pt":"português","pt-br":"português do Brasil","qu":"Runa Simi","qug":"Runa shimi","rgn":"Rumagnôl","rif":"Tarifit","rm":"rumantsch","rmf":"kaalengo tšimb","rmy":"romani čhib","rn":"Kirundi","ro":"română","roa-rup":"armãneashti","roa-tara":"tarandíne","ru":"русский","rue":"русиньскый","rup":"armãneashti","ruq":"Vlăheşte","ruq-cyrl":"Влахесте","ruq-latn":"Vlăheşte","rw":"Kinyarwanda","rwr":"मारवाड़ी","sa":"संस्कृतम्","sah":"саха тыла","sat":"ᱥᱟᱱᱛᱟᱲᱤ","sc":"sardu","scn":"sicilianu","sco":"Scots","sd":"سنڌي","sdc":"Sassaresu","sdh":"کوردی خوارگ","se":"davvisámegiella","sei":"Cmique Itom","ses":"Koyraboro Senni","sg":"Sängö","sgs":"žemaitėška","sh":"srpskohrvatski \/ српскохрватски","shi":"Taclḥit","shi-latn":"Taclḥit","shi-tfng":"ⵜⴰⵛⵍⵃⵉⵜ","shn":"ၽႃႇသႃႇတႆး ","shy":"tacawit","shy-latn":"tacawit","si":"සිංහල","simple":"Simple English","sjd":"Кӣллт са̄мь кӣлл","sje":"bidumsámegiella","sju":"ubmejesámiengiälla","sk":"slovenčina","skr":"سرائیکی","skr-arab":"سرائیکی","sl":"slovenščina","sli":"Schläsch","sm":"Gagana Samoa","sma":"åarjelsaemien","smj":"julevsámegiella","smn":"anarâškielâ","sms":"sääʹmǩiõll","sn":"chiShona","so":"Soomaaliga","sq":"shqip","sr":"српски \/ srpski","sr-ec":"српски (ћирилица)‎","sr-el":"srpski (latinica)‎","srn":"Sranantongo","srq":"mbia cheë","ss":"SiSwati","st":"Sesotho","stq":"Seeltersk","sty":"себертатар","su":"Sunda","sv":"svenska","sw":"Kiswahili","szl":"ślůnski","szy":"Sakizaya","ta":"தமிழ்","tay":"Tayal","tcy":"ತುಳು","te":"తెలుగు","tet":"tetun","tg":"тоҷикӣ","tg-cyrl":"тоҷикӣ","tg-latn":"tojikī","th":"ไทย","ti":"ትግርኛ","tk":"Türkmençe","tl":"Tagalog","tly":"tolışi","tly-cyrl":"толыши","tn":"Setswana","to":"lea faka-Tonga","tpi":"Tok Pisin","tr":"Türkçe","tru":"Ṫuroyo","trv":"Seediq","ts":"Xitsonga","tt":"татарча\/tatarça","tt-cyrl":"татарча","tt-latn":"tatarça","tum":"chiTumbuka","tw":"Twi","ty":"reo tahiti","tyv":"тыва дыл","tzm":"ⵜⴰⵎⴰⵣⵉⵖⵜ","udm":"удмурт","ug":"ئۇيغۇرچە \/ Uyghurche","ug-arab":"ئۇيغۇرچە","ug-latn":"Uyghurche","uk":"українська","ur":"اردو","uz":"oʻzbekcha\/ўзбекча","uz-cyrl":"ўзбекча","uz-latn":"oʻzbekcha","ve":"Tshivenda","vec":"vèneto","vep":"vepsän kel’","vi":"Tiếng Việt","vls":"West-Vlams","vmf":"Mainfränkisch","vo":"Volapük","vot":"Vaďďa","vro":"võro","wa":"walon","war":"Winaray","wo":"Wolof","wuu":"吴语","xal":"хальмг","xh":"isiXhosa","xmf":"მარგალური","xsy":"saisiyat","yi":"ייִדיש","yo":"Yorùbá","yue":"粵語","za":"Vahcuengh","zea":"Zeêuws","zgh":"ⵜⴰⵎⴰⵣⵉⵖⵜ ⵜⴰⵏⴰⵡⴰⵢⵜ","zh":"中文","zh-classical":"文言","zh-cn":"中文（中国大陆）‎","zh-hans":"中文（简体）‎","zh-hant":"中文（繁體）‎","zh-hk":"中文（香港）‎","zh-min-nan":"Bân-lâm-gú","zh-mo":"中文（澳門）‎","zh-my":"中文（马来西亚）‎","zh-sg":"中文（新加坡）‎","zh-tw":"中文（台灣）‎","zh-yue":"粵語","zu":"isiZulu"};

	// Copy link to Wikidata for future use
	$wdItem.find( 'a' ).removeAttr( 'lang' ).removeAttr( 'hreflang' ).removeClass( 'd' );
	var $listItem = $wdItem.clone();
	$listItem.removeClass( 'interwiki-d' );
	
	// Add a language link to list
	function addLanguageLink( code, obj ) {
		var name = isv.interwiki.lang[ code ];
		if ( !name ) {
			console.log('ext.gadget.interwiki: no name for ' + code + ' found. The link is not included.');
			return;
		}

		var isSuggested = isv.interwiki.suggestedList.indexOf( code ) > -1;
		var $item = $listItem.clone();
		$item.addClass( 'interwiki-' + code );
		isv.interwiki.linkCount++;
		if ( !isSuggested ) {
			if ( !isv.interwiki.showAll ) $item.css( 'display', 'none' );
			isv.interwiki.regularLinkCount++;
		}

		// Modify link
		var uppercaseName = name.charAt(0).toUpperCase() + name.slice(1);
		var $link = $item.find('a');
		$link.attr( 'href', obj.url )
			.attr( 'lang', code )
			.attr( 'hreflang', code );

		if ( !data.autonymSelector && !data.titleSelector ) {
			var linkTitle = obj.title + ' — ' + name;
			$link.attr( 'title', linkTitle )
				.text( uppercaseName );
		} else {
			$link.find( data.autonymSelector ).text( uppercaseName );
			$link.find( data.titleSelector ).text( obj.title );
		}

		var $list = $pLangList;
		if ( data.suggestedListSelector && isSuggested ) {
			$list = $( data.suggestedListSelector );
		}
		$list.append( $item );
	}

	// Initialise the creation of interwiki list
	isv.interwiki.init = function( response ) {
		var obj = {};
		isv.interwiki.linkCount = 0;
		isv.interwiki.regularLinkCount = 0;

		// Get sitelinks list from data from Wikidata
		if ( response ) {
			response = response.entities;
			var keys = Object.keys( response );
			obj = response[ keys[ 0 ] ].sitelinks;
		}

		// Ignore global Wikimedia wikis
		var ignoreList = [
			'commonswiki',
			'incubatorwiki',
			'mediawikiwiki',
			'metawiki',
			'sourceswiki',
			'specieswiki',
			'wikidatawiki',
			'wikimaniawiki'
		];
		
		// Sort interwiki list from Wikidata
		for ( var key in obj ) {
			var el = obj[ key ];
			delete obj[ key ];
			
			// Ignore non-Wikipedia sites
			if ( ignoreList.indexOf( key ) > -1 ) continue;
			var type = key.substr( key.length - 4 );
			if ( type !== 'wiki' ) continue;
			
			// Update object with version without "wiki" suffix and dashes
			var lang = key.substring( 0, key.length - 4 ).replace( /_/g, '-' );
			obj[ lang ] = el;
		}

		// Sort keys because Wikidata object is not sorted properly
		var sortedKeys = Object.keys( obj ).sort();
		for ( var index in sortedKeys ) {
			var key = sortedKeys[ index ];
			
			// Request creation of language links
			var currObj = obj[ key ];
			addLanguageLink( key, currObj );
		}

		// Move or update link to Wikidata
		if ( $( '#t-wikibase' ).length ) {
			$( '#t-wikibase' )
				.attr( 'href', $wdItem.find( 'a' ).attr( 'href' ) )
				.attr( 'title', $wdItem.find( 'a' ).attr( 'title' ) );
		} else {
			if ( $wdItem.text() === '' ) $wdItem.find( 'a' ).text( WIKIDATA_LABEL );
			$wdItem.removeAttr( 'class' ).attr( 'id', 't-wikibase' );
			$wdItem.insertAfter( data.wikidataPlacement || '#t-info' );
		}
		
		// Cache the list
		CACHE[ id ] = $pLangList.html();

		if ( data.callback ) data.callback();

		// Show hidden links if there’s not a lot of them
		if ( isv.interwiki.showAll ) {
			return;
		};
		if ( isv.interwiki.regularLinkCount < 2 || isv.interwiki.linkCount < 10 ) {
			$pLangList.find( 'li:hidden' ).show();
			return;
		}

		// Add a trigger button for showing links
		if ( !$( '.ext-gadget-interwiki-trigger' ).length ) {
			var $button = $( '<button>' ).addClass( 'mw-ui-button ext-gadget-interwiki-trigger' );
			$button.text( 'Ješče ' + isv.interwiki.regularLinkCount );
			$button.on( 'click', function( e ) {
				$pLangList.find( 'li:hidden' ).show();
				$( e.target ).remove();
			} );
			$pLangList.after( $button );
		}
	}
	
	// Do not make a request to Wikidata if it was made previously
	if ( id in CACHE ) {
		$pLangList.html( CACHE[ id ] );
		return;
	}

	// Get interwiki links from Wikidata ID
	$.ajax( {
		type: 'GET',
		url: 'https://www.wikidata.org/w/api.php',
		data: {
			format: 'json',
			action: 'wbgetentities',
			ids: id,
			props: 'sitelinks/urls',
			utf8: true,
			callback: 'isv.interwiki.init'
		},
		xhrFields: {
			withCredentials: true
		},
		dataType: 'jsonp'
	} );
}

// Custom setup with different selectors for mobile skin
function setupOnMinerva() {
	var $langListHeader = '';
	var data = {
		showAll: true,
		listSelector: '.language-searcher .all-languages',
		suggestedListSelector: '.language-searcher .suggested-languages',
		wikidataSelector: '.all-languages li',
		wikidataPlacement: '.all-languages li:last-child',
		autonymSelector: '.autonym',
		titleSelector: '.title',
		callback: function() {
			// Add missing label
			$( '#t-wikibase' ).find( '.autonym' ).text( WIKIDATA_LABEL );

			// Update link number
			if ( !$langListHeader.length ) {
				return;
			}
			$langListHeader.text(
				$langListHeader.text() + '(' + isv.interwiki.regularLinkCount + ')'
			);
			
			// Show the language list
			$( '.language-overlay .promised-view' ).remove();
			$( '.language-searcher' ).show();
		}
	}

	// Wait for Minerva interface to load
	function minervaInit() {
		if ( location.hash !== '#/languages' ) return;
		var waitForWikidata = setInterval( function() {
			if ( !$( data.wikidataSelector ).length ) {
				return;
			}
			clearInterval( waitForWikidata );
			
			// Add a spinner from MobileFrontend
			$( '.language-searcher' ).hide();
			$( '.language-searcher' ).after( '\
				<div class="promised-view view-border-box">\
					<div class="mw-ui-icon mw-ui-icon-mf-spinner mw-ui-icon-element spinner loading">'
					+ mw.msg( 'mobile-frontend-loading-message' ) +
				'</div></div>'
			);
			
			// Hide broken search bar
			$( '.language-searcher > .panel' ).hide();

			// Add suggested languages section
			$langListHeader = $( '.language-searcher .list-header' );
			var $suggestedList = $( data.listSelector ).clone();
			$suggestedList.removeClass( 'all-languages' )
				.addClass( 'suggested-languages' )
				.empty();

			var $suggestedListHeading = $langListHeader.clone();
			$suggestedListHeading.text( mw.msg( 'mobile-frontend-languages-structured-overlay-suggested-languages-header' ) );

			$langListHeader.before( $suggestedList );
			$suggestedList.before( $suggestedListHeading );

			// Remove link number
			$langListHeader.text( $langListHeader.text().replace( /\(\d+\)$/, '' ) );

			// Run the script
			$( renderInterwikiList( data ) );
		}, 100 );
	}

	// Run initialising script
	window.addEventListener( 'hashchange', minervaInit );
	minervaInit();

	return data;
}

// Fire event as soon as possible and on hook
if ( mw.config.get( 'skin' ) === 'minerva' ) {
	var dump = setupOnMinerva();
} else {
	$( renderInterwikiList );
	if ( [ 'edit', 'submit' ].indexOf( mw.config.get( 'wgAction' ) ) !== -1 ) {
		mw.hook( 'wikipage.content' ).add( renderInterwikiList );
	}
}
