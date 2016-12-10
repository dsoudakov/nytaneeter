// ==UserScript==
// @name         BookingReviewToCal
// @namespace    nytaneeter
// @version      0.1
// @description  add to Google Calendar
// @author       DS
// @match        http://nyta.chelseareservations.com/tennis/TNReviewMySchedule.aspx
// @grant        none
// @require https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';
    function serialize( obj ) {
        return '?'+Object.keys(obj).reduce(function(a,k){a.push(k+'='+encodeURIComponent(obj[k]));return a;},[]).join('&');
    }

    var googleEventURL = 'http://www.google.com/calendar/event';
    var playDateTable = $("#container > table > tbody > tr:nth-child(3) > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(1)");
    var rowsWithDates = playDateTable.parent('tr').nextAll();

    if(!rowsWithDates.length) return;

    var totalRows = rowsWithDates.length;
    var times = [];

    rowsWithDates.each(function( index ) {

        var playDate = $( this ).children()[0].innerText;
        var playTimeStart = $(this).children()[1].innerText;
        var facility = $(this).children()[2].innerText;
        var courtNum = $(this).children()[3].innerText;
        var p1 = $(this).children()[4].innerText;
        var p2 = $(this).children()[5].innerText;
        var p3 = ($(this).children()[6].innerText === "") ? "" : $(this).children()[6].innerText + '\n';
        var p4 = ($(this).children()[7].innerText === "") ? "" : $(this).children()[7].innerText + '\n';
        var eventText = "NYTA " + facility + ' | Court ' + parseInt(courtNum);

        times.push({playDate: playDate,
                    jq: this,
                    added: 0,
                    details: {
                        playDate: playDate,
                        playTimeStart: playTimeStart,
                        facility: facility,
                        courtNum: courtNum,
                        players: p1 + '\n' + p2 + '\n' + p3 + p4,
                        eventText: eventText
                    },
                    calEvent : {
                        action: 'TEMPLATE',
                        text: '',
                        dates: '',
                        details: '',
                        location: '',
                        trp: 'false'
                    }});

        var jsDate = new Date(times[index].playDate + ' ' + times[index].details.playTimeStart);
        var googleStartDate = jsDate.toISOString().replace(/-|:|\.\d\d\d/g,"");
        jsDate = new Date(jsDate.setHours(jsDate.getHours() + 1));
        var googleEndDate = jsDate.toISOString().replace(/-|:|\.\d\d\d/g,"");
        times[index].details.googleStartDate = googleStartDate;
        times[index].details.googleEndDate = googleEndDate;
        times[index].calEvent.text = times[index].details.eventText;
        times[index].calEvent.dates = times[index].details.googleStartDate + '/' + times[index].details.googleEndDate;
        times[index].calEvent.details = times[index].details.players;
        times[index].calEvent.location = times[index].details.facility;
        times[index].added = times[index].added + 1;

    });

    times.forEach(function(item,index){
        if(index + 1 <= totalRows - 1) {
            if(item.playDate == times[index + 1].playDate && times[index + 1].added == 1) {
                item.details.googleEndDate = times[index + 1].details.googleEndDate;
                item.calEvent.dates = item.details.googleStartDate + '/' + item.details.googleEndDate;
                times[index + 1].added = times[index + 1].added + 1;
            }
        }
    });

    times.forEach(function(item, index){
        var lastTD = $(item.jq).children().last();
        $(lastTD.children()[0]).hide(); // hide Outlook link
        var calLink = $(lastTD.children()[1]);
        if(item.added !== 1) {
            calLink.hide();
        } else {
            calLink.attr('href', googleEventURL + serialize(times[index].calEvent));
            calLink.attr('target', '_blank');
        }
    });
})();