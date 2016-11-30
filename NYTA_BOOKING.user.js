// ==UserScript==
// @name         NYTA
// @namespace    nytatennis
// @version      0.1
// @description  Better time table
// @author       DS
// @match        http://nyta.chelseareservations.com/tennis/TNBookingMulti.aspx
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @grant        GM_addStyle
// @require https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
// @require https://cdn.datatables.net/1.10.12/js/jquery.dataTables.min.js
// @require https://cdn.datatables.net/buttons/1.2.2/js/dataTables.buttons.min.js
// @require https://cdn.datatables.net/buttons/1.2.2/js/buttons.bootstrap.min.js
// @require https://cdn.datatables.net/1.10.12/js/dataTables.bootstrap.min.js

// ==/UserScript==

$("head").append (
    '<link '  + 'href="//cdn.datatables.net/r/bs-3.3.5/jq-2.1.4,dt-1.10.8/datatables.min.css" '  + 'rel="stylesheet" type="text/css">' +
    '<link '  + 'href="//cdn.datatables.net/buttons/1.2.2/css/buttons.bootstrap.min.css" '  + 'rel="stylesheet" type="text/css">'
);

(function() {
    // console.log('start');
    var dataTable;
    var lastSearch = "";
    var initDataTable = function() {

        if ( $.fn.dataTable.isDataTable( '#RequestTabPage_pnlBooking_GridView3' ) ) {
            return;
        }

        //console.log("initing table");

        var timesTable = $("#RequestTabPage_pnlBooking_GridView3");

        var thead = timesTable.find("thead");
        var thRows =  timesTable.find("tr:has(th)");

        if (thead.length===0){
            thead = $("<thead></thead>").appendTo(timesTable);
        }

        var copy = thRows.clone(true).appendTo("thead");
        thRows.remove();

        dataTable = timesTable.DataTable({
            "pageLength": 100,
            "dom": 'Bfti',
            "search": {
               "search": lastSearch
            },
            buttons: [
                {
                    text: 'PM SOUTH',
                    action: function ( e, dt, node, config ) {
                        dataTable.search( "pm south" ).draw();
                        lastSearch = "pm south";
                    },
                    enabled: true
                },
                {
                    text: 'PM EAST',
                    action: function ( e, dt, node, config ) {
                        dataTable.search( "pm east" ).draw();
                        lastSearch = "pm east";
                    },
                    enabled: true
                },
                {
                    text: 'PM NORTH',
                    action: function ( e, dt, node, config ) {
                        dataTable.search( "pm north" ).draw();
                        lastSearch = "pm north";
                    },
                    enabled: true
                },
                {
                    text: 'ALL',
                    action: function ( e, dt, node, config ) {
                        dataTable.search( "" ).draw();
                        lastSearch = "";
                    },
                    enabled: true
                }
            ]
        });

        dataTable.on( 'search.dt', function () {
           lastSearch = dataTable.search();
        });

        timesTable
            .removeClass( 'label14 no-footer' )
            .addClass("table table-striped table-bordered table-condensed");
        $("#RequestTabPage_pnlBooking_GridView3_filter").css("text-align","center");
    };

    var hideCrap = function() {

		//console.log('hiding crap');

        var clockDiv = $("div.label22");
        var hdr = $("div#header");
		var refreshLbl = $("#lblRefresh");
		var facilitySelection = $("#RequestTabPage_pnlBooking_Tr6");
		var courtType = $("#RequestTabPage_pnlBooking_Tr7");
        var buddyListChkbox = $("#cbAddtoBuddyList");
        var buddyListChkboxLbl = $("#UpdatePanel1 > table > tbody > tr:nth-child(2) > td > span > label");

        hdr.hide();
        clockDiv.hide();
        refreshLbl.hide();
		facilitySelection.hide();
		courtType.hide();
        buddyListChkbox.hide();
        buddyListChkboxLbl.hide();

        $("#RequestTabPage_pnlBooking_lblMaximumBookings").hide();
        $("#RequestTabPage_pnlBooking_PanelGridView3 > div").css("height", "");
        $("#RequestTabPage_header").hide();

        //console.log('hiding crap done');

	};

    hideCrap();

    var target = document.querySelector('#UpdatePanel1');
    var observer = new MutationObserver(function() {
        hideCrap();
        initDataTable();
        $('#RequestTabPage_pnlBooking_GridView3').find('.GridviewAltRow14').each(function(){
            $(this).removeClass("GridviewAltRow14");
        });


        if(dataTable !== "") {
           // console.log("DT search: " + dataTable.search());
           // console.log("Last search: " + lastSearch);
            if(dataTable.search() !== lastSearch && lastSearch !== "") {
                dataTable.search(lastSearch).draw();
            }
        }
    });

    var config = {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
    };

    observer.observe(target, config);

})();