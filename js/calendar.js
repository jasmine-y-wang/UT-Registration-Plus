$(function () {
    const materialColors = ['#4CAF50', '#CDDC39',
        '#FFC107', '#2196F3', '#F57C00', '#9C27B0', '#FF5722', '#673AB7',
        '#FF5252', '#E91E63', '#009688', '#00BCD4',
        '#4E342E', '#424242', '#9E9E9E'
    ];
    const days = new Map([
        ["M", "Monday"],
        ["T", "Tuesday"],
        ["W", "Wednesday"],
        ["TH", "Thursday"],
        ["F", "Friday"]
    ]);
    const fadetime = 150;
    const butdelay = 75;
    $("#calendar").prepend('<div id="myModal" class="modal"><div class="modal-content"><span class="close">&times;</span><div class="card"><div class="cardcontainer"><div><div style="display:flex;"><h2 id="classname">Classname</h2></div><p id="prof">Prof</p></div><div id="timelines"></div><button id="info" class="matbut" style="font-size:medium; margin-right: auto; margin-left:auto; background: #FF9800;">More Info</button></div></div></div></div>');
    // Counter to iterate through material colors to avoid duplicates
    var colorCounter = 0;
    // Each schedule needs to store 'TITLE - START TIME - END TIME - COLOR'
    var classSchedules = [];
    var savedCourses = [];
    var currLink = "";
    chrome.storage.sync.get("savedCourses", function (data) {
        // Iterate through each saved course and add to 'event'
        savedCourses = data.savedCourses;
        setAllEvents(savedCourses);

        $("#calendar").fullCalendar({
            editable: false, // Don't allow editing of events
            handleWindowResize: true,
            weekends: false, // will hide Saturdays and Sundays
            slotDuration: "00:30:00", // 15 minute intervals on vertical column
            slotEventOverlap: false, // No overlapping between events
            defaultView: "agendaWeek", // Only show week view
            header: false, // Hide buttons/titles
            minTime: "08:00:00", // Start time
            maxTime: "21:00:00", // End time
            columnHeaderFormat: "ddd", // Only show day of the week names
            displayEventTime: true, // Display event time
            allDaySlot: false,
            Duration: {
                hours: 1
            },
            height: 'auto',
            events: classSchedules,
            slotLabelFormat: [
                'h:mm A' // lower level of text
            ],
            eventRender: function (event, element, view) {
                $(element).css("padding", "5px");
                $(element).css("margin-bottom", "5px");

            },
            eventClick: function (data, event, view) {
                $("#myModal").fadeIn(fadetime);
                currLink = savedCourses[data.index].courseLink;
                var currunique = savedCourses[data.index].unique;
                $("#classname").html(`${savedCourses[data.index].coursename} <span style='font-size:small'>(${savedCourses[data.index].unique})</span>`);
                $("#timelines").append(makeLine(savedCourses[data.index].datetimearr));
                $("#prof").html(`with <span style='font-weight:bold;'>${savedCourses[data.index].profname}</span>`);
            }
        });
    });

    /* convert from the dtarr and maek the time lines*/
    function makeLine(datetimearr) {
        $(".time").remove();
        //converted times back
        var dtmap = new Map([]);
        for (var i = 0; i < datetimearr.length; i++) {
            datetimearr[i][1][0] = moment(datetimearr[i][1][0], ["HH:mm"]).format("h:mm A");
            datetimearr[i][1][1] = moment(datetimearr[i][1][1], ["HH:mm"]).format("h:mm A");
        }
        for (var i = 0; i < datetimearr.length; i++) {
            if (dtmap.has(String(datetimearr[i][1]))) {
                dtmap.set(String(datetimearr[i][1]), dtmap.get(String(datetimearr[i][1])) + datetimearr[i][0]);
            } else {
                dtmap.set(String(datetimearr[i][1]), datetimearr[i][0]);
            }
        }
        var output = "";
        var timearr = Array.from(dtmap.keys());
        var dayarr = Array.from(dtmap.values());
        console.log(timearr);
        console.log(dayarr);
        var building = "";
        for (var i = 0; i < dayarr.length; i++) {
            output += "<p class='time'><span style='font-size:medium'>" + dayarr[i] + "</span>: " + timearr[i].split(",")[0] + " to " + timearr[i].split(",")[1] + "<span style='float:right'; font-size: medium;>" + "</span></p>";
        }
        return output;
    }

    // When the user clicks on <span> (x), close the modal
    $(".close").click(() => {
        $("#myModal").fadeOut(fadetime);
    });
    $("#info").click(() => {
        setTimeout(() => {
            window.open(currLink);
        }, butdelay);
    });
    /*Close Modal when hit escape*/
    $(document).keydown((e) => {
        if (e.keyCode == 27) {
            $("#myModal").fadeOut(fadetime);
        }
        $("#snackbar").attr("class", "");
    });
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = (event) => {
        var modal = document.getElementById("myModal");
        if (event.target == modal) {
            $("#myModal").fadeOut(fadetime);
        }
    }


    // Iterate through each saved course and add to 'event'
    function setAllEvents(savedCourses) {
        colorCounter = 0;
        classSchedules = [];
        for (let i = 0; i < savedCourses.length; i++) {
            for (let j = 0; j < savedCourses[i].datetimearr.length; j++) {
                let session = savedCourses[i].datetimearr[j]; // One single session for a class
                setEventForSection(session, colorCounter, i);
            }
            colorCounter++;
        }
    }

    //create the event object for every section
    function setEventForSection(session, colorCounter, i) {
        var fullday = days.get(session[0]);
        var classInfo = savedCourses[i];
        var department = classInfo.coursename.substring(0, classInfo.coursename.search(/\d/) - 2);
        var course_nbr = classInfo.coursename.substring(classInfo.coursename.search(/\d/), classInfo.coursename.indexOf(" ", classInfo.coursename.search(/\d/)));
        var uncapProf = classInfo.profname;
        uncapProf = uncapProf.charAt(0) + uncapProf.substring(1).toLowerCase();
        classSchedules.push({
            title: `${department}-${course_nbr} with ${uncapProf}`,
            start: moment().format("YYYY-MM-") +
                moment()
                .day(fullday)
                ._d.toString()
                .split(" ")[2] +
                "T" +
                session[1][0] +
                ":00",
            end: moment().format("YYYY-MM-") +
                moment()
                .day(fullday)
                ._d.toString()
                .split(" ")[2] +
                "T" +
                session[1][1] +
                ":00",
            color: materialColors[colorCounter],
            index: i,
            allday: false
        });
    }
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.command == "updateCourseList" || request.command == "courseAdded") {
                chrome.storage.sync.get("savedCourses", function (data) {
                    savedCourses = data.savedCourses
                    setAllEvents(data.savedCourses);
                    console.log(classSchedules);
                    $('#calendar').fullCalendar('removeEventSources');
                    $("#calendar").fullCalendar('addEventSource', classSchedules, true);
                });
            }
        });
});