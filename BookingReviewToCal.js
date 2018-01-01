// ==UserScript==
// @name         BookingReviewToCal
// @namespace    nytaneeter
// @version      0.1
// @description  add to Google Calendar
// @author       DS
// @match        https://nyta.chelseareservations.com/tennis/TNReviewMySchedule.aspx
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @require https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js
// ==/UserScript==

(function() {
    'use strict';
    function serialize( obj ) {
        return '?'+Object.keys(obj).reduce(function(a,k){a.push(k+'='+encodeURIComponent(obj[k]));return a;},[]).join('&');
    }

    function Settingsobject(){this.prefix="",this.default={}}Settingsobject.prototype.set=function(a,b){b="boolean"==typeof b?b?"{b}1":"{b}0":"string"==typeof b?"{s}"+b:"number"==typeof b?"{n}"+b:"{o}"+b.toSource(),GM_setValue(this.prefix+""+a,b)},Settingsobject.prototype.get=function(name){var value=GM_getValue(this.prefix+""+name,this.default[name]||"{b}0");if(!value.indexOf)return value;if(0==value.indexOf("{o}"))try{return eval("("+value.substr(3)+")")}catch(a){return GM_log("Error while calling variable "+name+" while translating into an object: \n\n"+a+"\n\ncode:\n"+value.substr(3)),!1}return 0==value.indexOf("{b}")?!!parseInt(value.substr(3)):0==value.indexOf("{n}")?parseFloat(value.substr(3)):0==value.indexOf("{s}")?value.substr(3):value},Settingsobject.prototype.register=function(a,b){return this.default[a]=b,!0};

    var globalSettings=new Settingsobject();
    globalSettings.prefix="nytaBookingReview.";

    var googleEventURL = 'http://www.google.com/calendar/event';
    var playDateTable = $("td:contains('Play Date')");
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

    var GMhrefsToKeep = [];

    times.forEach(function(item, index){
        var lastTD = $(item.jq).children().last();
        $(lastTD.children()[0]).hide();
        var calLink = $(lastTD.children()[1]);
        if(item.added !== 1) {
            calLink.hide();
        } else {
            calLink.click(function(e){
                var linkHref = e.currentTarget.href;
                if(globalSettings.get(linkHref) == "clicked" || linkHref.indexOf('#') + 1 == linkHref.length ) {
                    e.preventDefault();
                    return;
                }
                globalSettings.set(linkHref, "clicked");
            });

            calLink.attr('href', googleEventURL + serialize(times[index].calEvent));
            calLink.attr('target', '_blank');

            var linkHref = calLink.attr('href');
            GMhrefsToKeep.push(globalSettings.prefix + linkHref);
            if(!globalSettings.get(linkHref)) {
                globalSettings.register(linkHref, false);
            } else {
                if(globalSettings.get(linkHref) == "clicked") {
                    calLink.after('<input type="checkbox" data-index="'+ index + '" id="chkBox' + index + '"  />Override');
                    $('#chkBox' + index).change(function(){
                        var thisLink = $($(this)[0]).prev();
                        if (this.checked) {
                            thisLink.attr('href', googleEventURL + serialize(times[$(this).data('index')].calEvent));
                            globalSettings.set(thisLink.attr('href'), "notclicked");
                            thisLink.attr('target', '_blank');
                        } else {
                            globalSettings.set(thisLink.attr('href'), "clicked");
                            thisLink.attr('href', '#');
                            thisLink.attr('target', '');
                        }
                    });
                    calLink.attr('href', '#');
                    calLink.attr('target', '');
                }
            }
        }
    });

    for (var GMval of GM_listValues()){
        if(GMhrefsToKeep.indexOf(GMval) == -1){
            GM_deleteValue(GMval);
        }
    }
})();
