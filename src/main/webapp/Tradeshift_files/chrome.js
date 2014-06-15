var currentframe = -1;
var _path = "/ts3/chrome/";
var mainpanelwidth = 0;
var notificationcounter = 0;
var oldnotificationcounter = 0;


$(document).ready(function() {
	// POSITIONING ON RESIZE
	$(window).resize(function(){fixsizes();});
	fixsizes();
	fixlinks($("body#appframe"));
	
	// INIT PAGE
	if (getQuerystring("page")==undefined) {
		var doload = "_activity?page=internal";
	} else {
		var doload = getQuerystring("page");
	}
	loadContent(doload,"next");
		
	instantupdates();

	function instantupdates() {

		itemCount("purchases","todo");

		$.ajax({url:ts3url+"content.php?contenttype=countlistenevents"}).done( function(d) {
			notificationcounter = parseInt(d);
			//console.log("loaded"+notificationcounter);
			if ((notificationcounter>oldnotificationcounter)&&(oldnotificationcounter!=0)) {
				showInstantNotification();
			}
			oldnotificationcounter = notificationcounter;
			setTimeout(instantupdates, 3000);
		});

	}
	
	
	img1 = new Image();
	img1.src = "img/updating.gif";
	
	$(".setuserimage").live("click",function(){
		$(".setuserimage").removeClass("active");
		$(this).addClass("active");
		$("#newemployeeimage").val($(this).data("img"));
	});
	
	$.ajax({url: ts3url+"contentupdate.php?action=instaswitchget&s=alternativefeed" }).done(function(d){
		
		// FIGURE OUT ACTIVITY STREAM
		if (d=="active") {
			$(".activity1").hide();
			$(".activity2").show();
			loadContent("_user","next");
		} else {
			$(".activity2").hide();
			$(".activity1").show();
		}
	});
});

function showInstantNotification() {
	$("body").append("<div class='instantnotification'></div>").find(".instantnotification").hide().load(ts3url+"content.php?contenttype=getlastlistenevent",function(){
		$(this).fadeIn("fast",function(){
			fixlinks($("body"));
		});	
		var nonoti = setTimeout(hideInstantNotification, 5000);
	});
}

function hideInstantNotification() {
	$(".instantnotification").fadeOut("slow",function(){
		$(this).remove();
	});
	clearTimeout(nonoti);
}
