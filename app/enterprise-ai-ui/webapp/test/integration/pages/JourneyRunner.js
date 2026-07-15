sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/madhulatha/enterpriseai/enterpriseaiui/test/integration/pages/BooksList.gen",
	"com/madhulatha/enterpriseai/enterpriseaiui/test/integration/pages/BooksObjectPage.gen"
], function (JourneyRunner, BooksListGenerated, BooksObjectPageGenerated) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/madhulatha/enterpriseai/enterpriseaiui') + '/test/flp.html#app-preview',
        pages: {
			onTheBooksListGenerated: BooksListGenerated,
			onTheBooksObjectPageGenerated: BooksObjectPageGenerated
        },
        async: true
    });

    return runner;
});

