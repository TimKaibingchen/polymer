// FUNCTIONS
var pickerobject = null;
var pickeropener = null;
var updatingobject = null;
var tempval = false;
var ts3url = "/ts3/chrome/";
var pickerarray = new Array();
var notificationcounter = 0;
var updateFakeDelay = 500; //ms
var popupNotificationShowTime = 4500; //ms
var alternativepreview = false;

var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf("android") > -1; //&& ua.indexOf("mobile");

// COMMON FOR ALL APP PAGES
var initcalled = false;

function init() {
	if (!initcalled) {
		setSizeClass();
		// KEYBOARD 
		$(document).live("keyup",function(e) {
			if (e.which==27) {
				//$(".picker .header a").click();
				closePicker(pickerarray[pickerarray.length-1]);
				//console.log(pickerarray[pickerarray.length-1]);
			}
		});
		
		fixlinks($("body"));
		fixPickers();
		
		// NEW INPUTS
		$(".boxinput input").live("focus",function(){
			$(this).parents(".boxinput").addClass("focus");
		});
		$(".boxinput input").live("blur",function(){
			$(this).parents(".boxinput").removeClass("focus");
		});
		$(".boxinput").live("click",function(){
			$(this).find("input").focus();
		});
		//initcalled = true;
		
		$(".makets3").live("click",function(){
			$("body").toggleClass("ts3");
		});

		getSettingValue("slowupdates");
	}
	
}

function getSettingValue(s) {
	$.ajax({url: ts3url+"contentupdate.php?action=instaswitchget&s="+s }).done(function(data) {
		switch (s) {
			case "slowupdates":
				if (data=="active") updateFakeDelay = 3000;
				break;
			case "alternativepreview":
				if (data=="active") alternativepreview = true;
				break;
		}
	});
}

function popupNotification(popMessage,popType) {
	if ((popMessage!=undefined)&&(popMessage!="")) {
		$("body").append("<div class='popupNotification "+popType+"'><span class='popMessage'>"+popMessage+"</span></div>");
		$(".popupNotification").hide().delay(500).slideDown("fast");
		setTimeout(function(){
			$(".popupNotification").slideUp("fast",function(){$(this).remove();});
		}, popupNotificationShowTime);
	}
}


function showPreview(offsetx,previewContent) {
	if (isover) {
		$("body").append("<div id='preview'>"+previewContent+"</div>");

		var pos = $(overobject).position();
		var postop = pos.top-$("#preview").height()-50-$(window).scrollTop();
		if (postop<0) {
			postop += $("#preview").height()+$(overobject).height()+55;
			$("#preview").addClass("flipped");
		}
		$("#preview").css("left",pos.left+offsetx);
		$("#preview").css("top",postop).hide().fadeIn(100);
	}
	clearTimeout(previewtimer);
}

function hidePreview() {
	$("body").find("#preview").remove();
	clearTimeout(previewtimer);
}

function getList(listcontents,listformat,contentworkflow,showactions) {
	//alert(contentworkflow);
	$("body").removeClass("singleobject");
	$("body").addClass("documentlist");
	$(".wrapper").addClass("list").load(ts3url+"content.php?contenttype=doclist&listcontents="+listcontents+"&listformat="+listformat+"&contentworkflow="+contentworkflow+"&showactions="+showactions,function(){
		init();
	});
}

function getFullObject(oid) {
	$("body").addClass("singleobject");
	$("body").removeClass("documentlist");
	$(".wrapper").addClass("list").load(ts3url+"content.php?contenttype=fullobject&object="+oid,function(){
		init();
	});
}

function itemCount(listcontents,itemfilter) {
	$("#"+itemfilter+" .counter").load(ts3url+"content.php?contenttype=itemcount&listcontents="+listcontents+"&contentworkflow="+itemfilter,function() {
		if ($(this).text()=="0") {
			$(this).hide();
		} else {
			$(this).show();
		}
		//notificationcounter = parseInt($("#todo .counter").html());
	});
}

function shownextstep_old(steppicker,doslide) {
	if ($(steppicker).find(".step.on").length==0) {
		$(steppicker).find(".steps").prepend("<div class='step dummy on'></div>");
	}
	$(steppicker).find(".step.on").fadeOut("fast",function(){
		$(steppicker).find(".step.dummy").remove();
		var nextstep;
		if ($(steppicker).find(".step.on").length==0) {
			nextstep = $(steppicker).find(".step:first-child");
		} else {
			nextstep = $(steppicker).find(".step.on").next();
		}
		$(this).removeClass("on");
		$(nextstep).addClass("on");
		if (doslide) {
			$(nextstep).hide().fadeIn();
		}
		
		if ($(nextstep).hasClass("stepwait")) {
			setTimeout(function(){shownextstep(steppicker,true)},$(nextstep).data("waittime"));
		}
		
		$(".nextstep").unbind("click").live("click",function(e){
			shownextstep(steppicker,true);
			e.stopPropagation();
			return false;
		});
	});
}

function shownextstep(steppicker) {
	if ($(steppicker).find(".step.on").length==0) {
		// NEW PICKER WITH NO VISIBLE STEPS
		$(steppicker).find(".step:first-child").addClass("on");
	} else {
		$(steppicker).find(".step.on").removeClass("on").next().addClass("on");
		
		if ($(steppicker).find(".step.on").hasClass("stepwait")) {
			setTimeout(function(){shownextstep(steppicker)}, $(steppicker).find(".step.on").data("waittime"));
		}
	}
	
	$(steppicker).find(".button.nextstep").unbind("click").one("click",function(e){
		shownextstep(steppicker);
		e.stopPropagation();
		return false;
	});
}

function setpickerpositions() {
	$(".picker:not(.on)").find(".pickerbox").css("margin-right","0px");
	for (i=0;i<=pickerarray.length;i++) {
		var offsetpx = (pickerarray.length-i-1)*11;
		$(pickerarray[i]).find(".pickerbox").css("margin-right",offsetpx+"px");
		var thisz = 50+5*i;
		$(pickerarray[i]).find(".pickerbox").css("z-index", thisz);
		if ((i+1)==pickerarray.length) {
			$(".overlay").css("z-index",thisz-1);
		}
	}

}

function closeallpickers() {
	$(".picker").each(function(){
		$(this).find(".header a").click();
	});
}

function fixPickers() {

	// OVERLAY
	$(".overlay").live("click",function(){
		closeallpickers();
	});
	// SHOW PICKER
	$(".showpicker").attr('readonly', 'readonly').live("click",function(e) {

		// HIDE IF IN PICKER
		//$(this).parents(".picker").removeClass("on");

		// SHOW & PREPARE PICKER
		if ($(this).data("object")!=undefined) pickerobject = $(this).data("object");
		pickeropener = $(this);
		var thepicker = $("#picker-"+$(this).data("picker"));
		pickerarray.push(thepicker);
		$("#picker-"+$(this).data("picker")).find(".showpicker").data("object",$(this).data("object"));
		
		// FIX STEPPERS
		$(thepicker).find(".step").removeClass("on");
		shownextstep(thepicker);
		
		setpickerpositions();
			
		// PREPARE PICKERS
		var picker = $(this).data("picker");
		$("#picker-"+picker+":not(.dontclear) input").val("").attr("checked",false); // RESET INPUTS
		$("#picker-"+picker+":not(.dontclear) textarea").val(""); // RESET INPUTS
		$("#picker-"+picker+":not(.dontclear) .options li").show();
		$("#picker-"+picker+":not(.dontclear) .options input").removeAttr("checked");
		$("#picker-"+picker+":not(.dontclear) .options a").removeClass("active");
		$("#picker-"+picker+":not(.dontclear) .options li.defaultHidden").hide();

		$("#picker-"+picker+":not(.dontclear) .options a").each(function(){
			if (!$(this).data("orgText")) {
				var curText = $(this).html();
				$(this).data("orgText",curText);
			} else {
				var curText = $(this).data("orgText");
				$(this).html(curText);
			}
		});
		//$("#picker-"+picker+" .options a.dummyactive").addClass("active");
		
		
		
		if (($(this).data("picker-desktop")==undefined)&&($("body").hasClass("desktop"))||(!$("body").hasClass("desktop"))) {
			// REGULAR PICKER
			window.parent.$("body").addClass("showoverlay");
			$("body").addClass("showoverlay");
			
			$("#picker-"+$(this).data("picker")).addClass("on").find(".object-rep").html("").load(ts3url+"content.php?contenttype=single&object="+pickerobject);
			
			if ($(this).parents(".list-item").find(".events").find(".event:last-child").hasClass("internal")) {
				$("#picker-"+$(this).data("picker")).find("a[data-val='Internal']").addClass("active");
				$("#picker-"+$(this).data("picker")).find("a[data-val='External']").removeClass("active");
			} else {
				$("#picker-"+$(this).data("picker")).find("a[data-val='Internal']").removeClass("active");
				$("#picker-"+$(this).data("picker")).find("a[data-val='External']").addClass("active");
			}
		} else {
			// INLINE PICKER
			inlinepicker = $(this).parents(".workflow-actions").find("."+$(this).data("picker-desktop"));
			
			$(this).parents(".workflow-actions ul").fadeOut(100,function(){
			
				if ($(inlinepicker).parents(".list-item").find(".events").find(".event:last-child").hasClass("internal")) {
					$("input#commmentscopeInternal").attr("checked","checked");
					$(inlinepicker).find("#makeinternal").attr("checked","checked");
				} else {
					$("input#commmentscopeExternal").attr("checked","checked");
				}
				
				$(inlinepicker).fadeIn(100,function(){
					$(this).find("input.maininput").focus();
				});
			
			});
		}
				
		// FOCUS ON SEARCH IF NONE ACTIVE
		/*
		$(this).blur();
		if (($("#picker-"+$(this).data("picker")).find("a.active").length==0)&&(!isAndroid)) {
			$("#picker-"+$(this).data("picker")).find("input").focus();
		}*/

			
		if (picker=="tag") {
			$.getJSON(ts3url+"contentupdate.php?action=gettagsjson&object="+pickerobject,function(data){
				for (i=0;i<data.length;i++) {
					$("#"+data[i].tag_name).val(data[i].tag_value);
				}
					
			});
		}
		if (picker=="recordpayment") {
			$.ajax({url: ts3url+"contentupdate.php?action=getremainingpayment&object="+pickerobject+"&direction=object_paymentrecorded" }).done(function(data) {
				$("#recordamount").val(data);
			});
		}
		if (picker=="paywithx") {
			$.ajax({url: ts3url+"contentupdate.php?action=getremainingpayment&object="+pickerobject+"&direction=object_paymentsent" }).done(function(data) {
				$("#paywithxamount").val(data);
			});
		}
		if (picker=="sendpayment") {
			$.ajax({url: ts3url+"contentupdate.php?action=getremainingpayment&object="+pickerobject+"&direction=object_paymentsent" }).done(function(data) {
				$("#sendamount").val(data);
			});
		}
		if (picker=="recipient") {
			var preselectedcompanyid = parseInt( $("#recipientcompanyid").val() );
			if (preselectedcompanyid!=-1) {
				$("#picker-"+$(this).data("picker")+" li:not(.input)").hide();
				$("#picker-"+$(this).data("picker")).find("li[data-companyid="+preselectedcompanyid+"]").show();
			}
		}
		if (picker=="memo") {
			if (getQuerystring("page")=="discovery") publishto = "public";
			if (getQuerystring("page")=="internal") publishto = "internal";
			$("a[data-val='"+publishto+"']").addClass("active");
		}
		if (picker=="employee") {
			$.ajax({url: ts3url+"contentupdate.php?action=getemployeecard&employeeid="+pickerobject }).done(function(data) {
				obj = $.parseJSON(data);
				$("#emprep .empname").text(obj[0].employee_name);
				$("#emprep .emprole").text(obj[0].employee_role);
				$("#emprep .empcompany").text(obj[0].employee_company);
				if (obj[0].employee_linkedin) {
					$("#emprep .linkedinlink").show().attr("href",obj[0].employee_linkedin);
				} else {
					$("#emprep .linkedinlink").hide();					
				}
				$("#emprep .employeebg").css("background-image","url('../employees/"+obj[0].employee_image+"')");
			});
			
		}
		if (picker=="statuschange") {
			var activeStatus = $(pickeropener).parents(".invoice2").data("status");
			$("#picker-statuschange .object-rep-nonauto").html("<a class='object invoice paid'>"+$(pickeropener).parents(".invoice2").html()+"</a>");
			$("#picker-statuschange .object-rep-nonauto .statuschanger2").remove();
			$("#picker-statuschange .options a").removeClass("active");
			$("#picker-statuschange .options").find("a[data-val='"+activeStatus+"']").addClass("active");
			//filter(':data(val=Paid').addClass("active");
		}
		return false;
		e.stopPropagation();
	});
	
	// CLOSE
	$(".pickerbox .header a").live("click",function(e) {
		closePicker(this);
		return false;
		e.stopPropagation();
	});
	
	// INLINE COMMENT REMOVE
	$(".inlineaction a.close").live("click",function(e){
		if ($(this).parents(".maininputwrap").find("input").val()=="") {
			hideInlineAction($(this).parents(".inlineaction"));	
		} else {
			$(this).parents(".maininputwrap").find("input").val("");
		}
		e.stopPropagation();
		return false;
	});
	$(".inlineaction input[type=radio],.inlineaction input[type=checkbox]").live("click",function(){
		$(this).parents(".inlineaction").find(".maininput").focus();
	});
	$(".inlineaction input.maininput").live("keyup",function(k){
		if (k.which==27) {
			hideInlineAction($(this).parents(".inlineaction"));
		}
		if (k.which==13) {
			$("#picker-comment .pickercomment").val($(this).val());
			$("#picker-comment #commentscope a").removeClass("active");
			cscope = $(this).parents(".inlineaction").find("input:radio[name=commentscope]:checked").val();
			/*cscope = "External";
			if ($(this).parents(".inlineaction").find("input#makeinternal").attr("checked")=="checked") {
				cscope = "Internal";
			}*/
			$("#picker-comment #commentscope a").removeClass("active");
			$("#picker-comment #commentscope a[data-val="+cscope+"]").addClass("active");
			$("#picker-comment .done").click();
		}
	});
	
	function hideInlineAction(o) {
		$(o).find("input").blur();
		$(o).parents(".workflow-actions").find(".inlineaction").fadeOut("fast",function(){
			$(this).find("input").val("");
			$(this).parents(".workflow-actions").find("ul").fadeIn();
		});
	}
	
	// OPTIONS
	$(".pickerbox .options a:not(.reallink)").live("mousedown",function() {
		$(this).parents(".options:not(.multioptionselect)").find("a").removeClass("active");
		if ($(this).parents(".multioptionselect").length>0) {
			if (!$(this).hasClass("showpicker")) $(this).toggleClass("active");
		} else {
			$(this).addClass("active");
		}
		return false;
	});
	$("a.reallink").live("mousedown",function(){
		closeallpickers();
	});
	
	// DONE CODING

	$(".pickerbox .done").unbind("click").live("click",function(e) {
		//$(e.target).
		$(".showpicker").removeClass("active");
		var actiontype = $(this).parents(".picker").data("pickertype");
		var returnval;
		
		
		doPrep = ["picker-code","picker-approve","picker-recordpayment","picker-share","picker-recordpayment","picker-sendpayment","picker-paywithx","picker-comment","picker-statuschange","picker-dispute","picker-disputeresolve","picker-statuschange2"];
		if (doPrep.indexOf(actiontype)!=-1) {
			prepPickerListItem();
		}
		
		switch (actiontype) {

		
			case "picker-appactivate":
				//$.ajax({url: ts3url+"contentupdate.php?action=appactivation&app=Intuit%20Payments" }).done(function(){
				var theapp = $(this).parents(".picker").data("activatedapp");
				console.log(theapp);
				$.ajax({url: ts3url+"contentupdate.php?action=appactivation&app="+theapp }).done(function(){
					//$("#app_intuit").addClass("activated");
					//$("#app_intuit .button").text("Deactivate");
					$(pickeropener).parents(".appbox").addClass("activated");
				});
				break;
			case "picker-code":
				var tags = "";
				var queryadd = "&approveit="+$("#approveit").is(":checked");

				$(this).parents(".pickerbox").find(".tags input").each( function() {
					if ($(this).val()!="") {
						tags += $(this).data("tag")+"---"+$(this).val()+"|";
					}
				});
				
				$.ajax({url: ts3url+"contentupdate.php?action=apply_recipient_tags&tags="+encodeURIComponent(tags)+"&object="+pickerobject+queryadd }).done(function(){
					
					updatePickerListItem(true,1,"Document successfully coded!","confirmation");
					
					itemCount("purchases","uncoded");
					itemCount("purchases","unapproved");
				});
				break;
			case "picker-approve":
				$.ajax({url: ts3url+"contentupdate.php?action=approve&object="+pickerobject+ pickerComment(this) }).done(function(){
					updatePickerListItem(true,1,"Document approved!","confirmation");
					itemCount("purchases","uncoded");
					itemCount("purchases","unapproved");
				});
				break;
			case "picker-recipientcompany":
				var obj = $(this).parents(".pickerbox").find(".options a.active");
			
				if (obj.length==0) {
					obj = $(this).parents(".pickerbox").find("input.optionsearch");
					_value = obj.val();
					$("#"+$(obj).data("targettext")).val(_value);
					$("#"+$(obj).data("targetid")).val(_value);
				} else {
					_value = $(obj).data("val");
					$("#"+$(obj).data("targettext")).val($(obj).data("valtext"));
					$("#"+$(obj).data("targetid")).val($(obj).data("val"));
				}
				$("#recipientname").val("");
				$("#recipientid").val(-1);
				break;
			case "picker-recipient":
				var obj = $(this).parents(".pickerbox").find(".options a.active");
			
				if (obj.length==0) {
					obj = $(this).parents(".pickerbox").find("input.optionsearch");
					_value = obj.val();
					$("#"+$(obj).data("targettext")).val(_value);
					$("#"+$(obj).data("targetid")).val(_value);
				} else {
					$("#"+$(obj).data("targettext")).val($(obj).data("valtext"));
					$("#"+$(obj).data("targetid")).val($(obj).data("val"));
					
					// SET RIGHT RECEIVING COMPANY
					var co_name = $(obj).parents("li").data("companyname");
					var co_id = $(obj).parents("li").data("companyid");
					if (co_id) {
						$("#recipientcompanyname").val(co_name);
						$("#recipientcompanyid").val(co_id);
					}
				}
				break;
				/*
			case "picker-delegate":
				//alert("Not implemented yet");
				var obj = $(this).parents(".pickerbox").find(".options a.active");
				var _value = obj.data("val");
				if (_value!=undefined) {					
					$.ajax({url: ts3url+"contentupdate.php?action=delegate&delegatee="+_value+"&object="+pickerobject+pickerComment(this) }).done(function(){
						updatePickerListItem(true,1);
						itemCount("purchases","uncoded");
						itemCount("purchases","unapproved");
					});
				}
				break;*/
			case "picker-share":

				var obj = $(this).parents(".pickerbox").find(".options a.active");
				var _value = obj.data("val");
				var searchval = $(this).parents(".pickerbox").find("input.optionsearch").val();
				if ((_value==undefined)&&(searchval!="")) _value = searchval;
				var queryadd = "&delegateit="+$("#delegateit").is(":checked");
				tempval = $("#delegateit").is(":checked");
				//var pickerocmment = $(this).parents(".pickerbox").find("input.optionsearch").val();
				
				if (_value!=undefined) {					
					$.ajax({url: ts3url+"contentupdate.php?action=share&sharee="+_value+"&object="+pickerobject+queryadd+pickerComment(this) }).done(function(){
						shareactiontxt = "shared";
						if (tempval) shareactiontxt = "delegated";
						updatePickerListItem(tempval,1,"Successfully "+shareactiontxt+"!","confirmation");
						itemCount("purchases","uncoded");
						itemCount("purchases","unapproved");
					});
				}
				break;
			case "picker-recordpayment":
				$.ajax({url: ts3url+"contentupdate.php?action=recordpayment&amount="+$("#recordamount").val()+"&object="+pickerobject }).done(function(){
					updatePickerListItem(tempval,1,"Payment recorded!","confirmation");
					//itemCount("purchases","uncoded");
					//itemCount("purchases","unapproved");
				});
				
				break;
			case "picker-sendpayment":
				$.ajax({url: ts3url+"contentupdate.php?action=sendpayment&amount="+$("#sendamount").val()+"&object="+pickerobject }).done(function(){
					updatePickerListItem(tempval,1,"Payment sent!","confirmation");
					//itemCount("purchases","uncoded");
					//itemCount("purchases","unapproved");
				});
				
				break;
			case "picker-paywithx":
				$.ajax({url: ts3url+"contentupdate.php?action=paywithx&amount="+$("#paywithxamount").val()+"&object="+pickerobject }).done(function(){
					updatePickerListItem(tempval,1,"Invoice successfully paid!","confirmation");
					//itemCount("purchases","uncoded");
					//itemCount("purchases","unapproved");
				});
				
				break;
			case "picker-dispute":
				var obj = $(this).parents(".pickerbox").find(".options a.active");
				var _value = obj.data("val");
				if (_value!=undefined) {
					$.ajax({url: ts3url+"contentupdate.php?action=dispute&disputeaction="+_value+"&object="+pickerobject+pickerComment(this) }).done(function(){
						updatePickerListItem(true,1,"Invoice disputed!","confirmation");
						itemCount("purchases","uncoded");
						itemCount("purchases","unapproved");
						itemCount("purchases","disputed");
					});
				}
				break;
			case "picker-disputeresolve":
				var obj = $(this).parents(".pickerbox").find(".options a.active");
				$.ajax({url: ts3url+"contentupdate.php?action=disputeresolve&object="+pickerobject+pickerComment(this) }).done(function(){
					updatePickerListItem(true,1,"Dispute resolved!","confirmation");
					itemCount("purchases","uncoded");
					itemCount("purchases","unapproved");
					itemCount("purchases","disputed");
				});
				break;
			case "picker-generalledger":
				$(pickeropener).val($("#picker-generalledger .options .active").data("val"));
				break;
			case "picker-costcenter":
				$(pickeropener).val($("#picker-costcenter .options .active").data("val"));
				break;
			case "picker-internalorder":
				var v = $(this).parents(".pickerbox").find("input").val();
				$(pickeropener).val(v);
				break;
			case "picker-wbs":
				var v = $(this).parents(".pickerbox").find("input").val();
				$(pickeropener).val(v);
				break;
			case "picker-comment":
				var eventscope = $(this).parents(".pickerbox").find("#commentscope a.active").data("val");
				var eventcomment = $(this).parents(".pickerbox").find("#newcomment").val();
				$.ajax({url: ts3url+"contentupdate.php?action=comment&object="+pickerobject+"&eventscope="+eventscope+pickerComment(this) }).done(function(){
					updatePickerListItem(false,1);
					//appendLastEventCurrent();
				});
				break;
			case "picker-memo":
				var eventscope = $(this).parents(".pickerbox").find("#memoscope a.active").data("val");
				var eventmemo = $(this).parents(".pickerbox").find("#newmemo").val();

				$.ajax({url: ts3url+"contentupdate.php?action=memo&object="+pickerobject+"&eventscope="+eventscope+pickerComment(this) }).done(function(){
					window.location.reload();
				});
				break;
			case "picker-listformat":
				listFormat($(this).data("val")); // _activity/script.js
				break;
			case "picker-statuschange":
				var newStatus = $(this).data("val");
				var invoiceObject = $(pickeropener).parents(".invoice2");
				var currentStatus = $(invoiceObject).data("status");
				$(invoiceObject).removeClass("active");

				if (currentStatus!=newStatus) {
					$(invoiceObject).addClass("updating");
					
					setTimeout(function(){
						$(".invoice2.updating").each(function(){
							//$("#docsarchive .invoice2:first-child").prepend("<div class=invoice2>test</div>");
							$(this).removeClass("updating");
							$(this).slideUp();
							popupNotification("Document status updated!","confirmation");
						});
					}, updateFakeDelay);
				}
				break;
			case "picker-statuschange2":
				$.ajax({url: ts3url+"contentupdate.php?action=setstatus&object="+pickerobject+"&newStatus="+$(this).data("val") }).done(function(){
					updatePickerListItem(false,1);
					//appendLastEventCurrent();
				});
				break;
			case "picker-ddterms":
				$(pickeropener).val($("#picker-ddterms .options .active").data("val"));
				break;
			
			}

		if ($(this).hasClass("closeallpickers")) {
			closeallpickers();
		} else {
			closePicker(this);
		}
		return false;
		e.stopPropagation();
	});	
	
	
	$("input.optionsearch").keyup(function(){
		var txt = $(this).val().toLowerCase();
		if (txt!="") {
			var opts = $(this).parents(".options").find("li:not(.input)").each(function(){
				var thisVal = $(this).find("a").data("orgText");
				var strIndex = thisVal.toLowerCase().indexOf(txt);
				if (strIndex!=-1) {
						var thisVal2; // = thisVal.replace(txt, "<b>"+txt+"</b>");
						var str1 = thisVal.substr(0, strIndex);
						var str2 = thisVal.substr(strIndex,txt.length);
						var str3 = thisVal.substr((strIndex+txt.length), thisVal.length);
						$(this).find("a").html(str1+"<b>"+str2+"</b>"+str3);	
						//$(this).find("a").html(thisVal2);	
						$(this).show();
				} else {
					$(this).hide();
				}
			});
		} else {
			var opts = $(this).parents(".options").find("li:not(.input)").each(function(){
				var thisVal = $(this).find("a").data("orgText");
				$(this).find("a").html(thisVal);
			});
			$(this).parents(".options").find("li:not(.defaultHidden)").show();
			$(this).parents(".options").find("li.defaultHidden").hide();
		}
	});
	
	$("input.autosave").blur(function() {
		//$query = "update ".$_GET["table"]." set ".$_GET["field"]."='".$_GET["value"]."' where ".$_GET["idfield"]."=".$_GET["rowid"];
		__table = $(this).data("table");
		__field = $(this).data("field");
		__value = $(this).val();
		__idfield = $(this).data("idfield");
		__rowid = $(this).data("rowid");
		console.log(ts3url+'contentupdate.php?action=savefield&table='+__table+'&field='+__field+'&value='+__value+'&idfield='+__idfield+'&rowid='+__rowid);
		$.ajax({url:ts3url+'contentupdate.php?action=savefield&table='+__table+'&field='+__field+'&value='+__value+'&idfield='+__idfield+'&rowid='+__rowid}).done(function(){
			console.log("saved");
		});
	});
}

function pickerComment(o) {
	return "&pickercomment="+encodeURIComponent($(o).parents(".picker").find(".pickercomment").val());
}

function appendLastEventCurrent() {
	$.ajax({url: ts3url+"content.php?contenttype=lastevent&object="+pickerobject+"&showactions=showactions" }).done(function(data){
		var o = $(".list-item[data-object="+pickerobject+"]");
		$(o).find(".events").append(data);
		$(o).find(".event:last").hide().slideDown("fast");
		$(o).find(".workflow-actions").remove();
		$(o).append("Updated workflow actions");
	});
}

function prepPickerListItem() {
	var o = $(".list-item[data-object="+pickerobject+"]").parents(".oneobject");
	$(o).addClass("updating");
}

function updatePickerListItem(doremove,addedevents,popMsg,popType) {
	var o = $(".list-item[data-object="+pickerobject+"]");
	if (($(o).parents(".todolist2").length>0)&&(doremove)) {
		removeFromList(pickerobject);
		popupNotification(popMsg,popType);				
	} else {
		//appendLastEventCurrent();
		var listformat = $(o).data("listformat");
		var showactions = $(o).data("showactions");
		var workflowstatus = $(o).data("workflowstatus");
		var visibleevents = ($(o).find(".event:not(.defaulthidden,.eventall)").length-1)+addedevents;
		setTimeout(function(){
			$(o).load(ts3url+"content.php?contenttype=single&object="+pickerobject+"&listformat="+listformat+"&showactions="+showactions+"&workflowstatus="+workflowstatus+"&visibleevents="+visibleevents,function(){
				//$(o).find(".feedactivity .event:last-child").hide().wait(100).slideDown();
				$(o).parents(".updating").removeClass("updating");
				$(o).prev(".intro").remove(); // REMOVE INTRO FROM NEW ITEM TO GET NEW INTRO
				$(this).children(':first').unwrap();
				fixlinks($("body"));
				popupNotification(popMsg,popType);				
			});
		},updateFakeDelay);
	}
}

function removeFromList(oid) {
	$(".list-item[data-object="+oid+"]").parents(".oneobject").slideUp();
}


function setEmployee(eid) {
	$.ajax({url: ts3url+"contentupdate.php?action=setemployee&employeeid="+eid }).done(function(){
		$(".object-"+pickerobject).slideUp();
	});
}

function closePicker(o) {
	if ($(o).hasClass("picker")) {
		$(o).removeClass("on");
	} else {
		$(o).parents(".picker").removeClass("on");
	}
	pickerarray.pop();
	setpickerpositions();
	if ($(".picker.on").length==0) {
		$("body").removeClass("showoverlay");
		window.parent.$("body").removeClass("showoverlay");
	}
}

function getQuerystring(key) {
    var query = window.location.search.substring(1);
    //alert(query);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == key) {
            return pair[1];
        }
    }
}

function setHighlight(url) {
	if (top.$("a[href='"+url+"']").length>0) {
		top.$("a").removeClass("active");
		top.$("a[href='"+url+"']").addClass("active");
	}
}

Number.prototype.formatMoney = function(c, d, t){
var n = this, c = isNaN(c = Math.abs(c)) ? 2 : c, d = d == undefined ? "," : d, t = t == undefined ? "." : t, s = n < 0 ? "-" : "", i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

function stepBack() {
	var _left = $("#contentwrapper").position().left;
	var _width = $("#contentwrapper").width();
	$("#contentwrapper").css("left",_left+_width+"px");
	currentframe--;
	setHighlight($("#frame"+currentframe).attr("src"));
}

function fixlinks(o) {

	$(o).contents().find("a").each(function(){

		if ($(this).find(".icon").length===0) { $(this).addClass("textonly"); }
		
		if ($(this).data("openin")!=undefined) {
			//$(this).css("outline","#f00 solid 1px");
			// VISUAL CHANGE
			//$(this).css("border","1px dotted #f00");
			
			$(this).unbind("click");
			$(this).live("click",function(e){
				//var isInIframe = (window.location != window.parent.location) ? true : false;
	
				if ($(this).hasClass("btn_confirm")) {
					proceed = confirm("Delete everything?");
					if (!proceed) {
						e.stopPropagation();
						return false;
					}
				}
				
				top.$("body").removeClass("noanimation");
				var _openin = $(this).data("openin");
				
				if ((_openin==="next")||(_openin==="this")) {
					top.loadContent($(this).attr("href"),_openin);
					top.$("body").removeClass("menu");
					top.$("#shortcuts").css("top",$("#menu-global").scrollTop()+"px");
				} else if (_openin==="prev") {
					top.stepBack();
				} else if (_openin==="menu") {
					top.$("body").toggleClass("menu");
				} else if (_openin==="top") {
					top.location.href = ts3url+$(this).attr("href");
				}
				
				if ($(e.target).hasClass("fullscreen")) {
					$("body").addClass("fullscreen");
				} else {
					$("body").removeClass("fullscreen");
				}
				
				e.stopPropagation();
				return false;
			});
		}
		
		// INSTANT ACTIONS
		if ($(this).hasClass("instaction")) {
			$(this).unbind("click");
			$(this).live("click",function(e){
				if ($(this).data("action")=="togglefollow") {
					if ($(this).data("object")!=undefined) pickerobject = $(this).data("object");
					pickeropener = $(this);
					$.ajax({url: ts3url+"contentupdate.php?action=togglefollow&object="+pickerobject }).done(function(){
						updatePickerListItem(true,0);
						itemCount("purchases","uncoded");
						itemCount("purchases","unapproved");
						itemCount("purchases","disputed");
					});
				}
			});
		}
		
		// SWITCHES
		if ($(this).hasClass("instaswitch")) {
			$(this).unbind("click");

			$.ajax({url: ts3url+"contentupdate.php?action=instaswitchget&s="+$(this).data("settingname"), context: $(this) }).done(function(d){
				if (d==$(this).data("settingvalue")) $(this).addClass("active");
			});
			$(this).live("click",function(e){
				$(this).toggleClass("active");
				 var v = "";
				 if ($(this).hasClass("active")) v = $(this).data("settingvalue");
				 var s = $(this).data("settingname");
				 $.ajax({url: ts3url+"contentupdate.php?action=instaswitch&s="+s+"&v="+v }).done(function(d){
				 });
			});
			
		}
		
		
		// VIEW ALL EVENTS
		if ($(this).hasClass("eventall")) {
			$(this).unbind("click");
			$(this).live("click",function(e) {
				updatingobject = this;
				$(updatingobject).parent().parent().addClass("updating");
				$(updatingobject).html("Please wait&hellip;");
				setTimeout(function(){
					$(updatingobject).parents(".events").find(".defaulthidden").removeClass("defaulthidden");
					$(updatingobject).parent().parent().remove();
				}, 300);
				e.preventDefault();
				return false;
			});
		}
	});
}

function getSetting(settingname) {
	$.ajax({url: ts3url+"contentupdate.php?action=instaswitchget&s="+settingname }).done(function(d){
		return d;
	});
}

function fixsizes() {
	setSizeClass();
	
	//hidePreview();

	var counter = 0;
	$("body").removeClass("menu");

	//mainpanelwidth = $(window).width()-$("#menu-global").width()-$("#menu-global").position().left;
	
	mainpanelwidth =  $(window).width();

	if ($("body").hasClass("tablet")) {
		mainpanelwidth -= 66;
	}
	if ($("body").hasClass("desktoplarge")) {
		mainpanelwidth -= (320-66);
	}
		

	$("#contentwrapper iframe").each(function(){
		$(this).css("width",mainpanelwidth);
		$(this).css("left",mainpanelwidth*counter);
		counter++;
	});
	$("#contentwrapper").css("width",mainpanelwidth);
	$("#contentwrapper").css("left",-currentframe*mainpanelwidth);
	
}

function setSizeClass() {
	var isFullScreen = $("body").hasClass("fullscreen");
	var sizeClasses = new Array("phone","tablet","desktop","desktoplarge");
	var winSize = top.$("body").width();
	var addClasses = new Array();
	var removeClasses = new Array();
	if (winSize>0) { addClasses.push(sizeClasses[0]); } else { removeClasses.push(sizeClasses[0]); }
	//if (winSize>480) { addClasses.push(sizeClasses[0]); } else { removeClasses.push(sizeClasses[0]); }
	if (winSize>768) { addClasses.push(sizeClasses[1]); } else { removeClasses.push(sizeClasses[1]); }
	if ((winSize>980)&&(!isFullScreen)) { addClasses.push(sizeClasses[2]); } else { removeClasses.push(sizeClasses[2]); }
	if ((winSize>1140)&&(!isFullScreen)) { addClasses.push(sizeClasses[3]); } else { removeClasses.push(sizeClasses[3]); }
	top.$("body").removeClass(removeClasses.join(" ")).addClass(addClasses.join(" "));
	top.$("iframe").contents().find("body").removeClass(removeClasses.join(" ")).addClass(addClasses.join(" "));	
}



function openpage(_frame,_url) {
	$(_frame).contents().find("body").html("").append("<div style='display:table;height:100%;width:100%;text-align:center;border:2px dashed #aaa;background:url(\'../img/updating.gif\')'><div style='display:table-cell;vertical-align:middle;font-family:sans-serif,arial;color:#aaa;font-size:24px;font-weight:normal;'>Loading</div></div>");

	setTimeout(function(){ $(_frame).attr("src",_url);	fixsizes();
	 },100); // WAS 300
	
}

function loadContent(url,frame) {
	var _frame;
	
	// PASS ON ALL URL PARAMETERS IN QUERYSTRING
	if (window.location.search!="?v=25") url = url + window.location.search;	
	
	// LOAD IN SAME FRAME
	if (frame==="this") {
		_frame = "#frame"+currentframe;
		openpage(_frame,url);

	// LOAD IN NEXT FRAME
	} else {
		currentframe++;
		
		var _width = $("#contentwrapper").width();
		var _offset = _width*currentframe;
		_frame = "#frame"+currentframe;
		
		// CHECK IF FRAME EXISTS
		if ($(_frame).length===0) {
			$("#contentwrapper").append("<iframe style='left:"+_offset+"px;width:"+_width+"' id='frame"+currentframe+"'></iframe>");
		}
		
		// POSITION
		$("#contentwrapper").css("left",-_offset);

		openpage(_frame,(_path+url));
	}
	
	// UPDATE IFRAME
	$(_frame).unbind("load").load(function(){
		//$(this).contents().find("body").hide().fadeIn();
		if ($(this).contents().find("#menu-contextual #context-left").length==0) $(this).contents().find("#menu-contextual").prepend("<div id='context-left'></div>");
		if ($(this).contents().find("#menu-contextual #context-right").length==0) $(this).contents().find("#menu-contextual").append("<div id='context-right'></div>");

		
		// ADD MENU BUTTON
		if (($(this).contents().find("#context-left .togglemenu").length===0)) {
			$(this).contents().find("#context-left").append("<a href='#' class='togglemenu contextualopener icononly' data-openin='menu'><span class='icon shifties-menuswitch'></span><span class='counter'></span></a>");			
		}
		// ADD PREV BUTTON
		if (($(this).contents().find("#context-left .prev").length===0)&&(currentframe!==0)) {
			$(this).contents().find("#context-left").append("<a href='#' data-openin='prev' class='prev icononly'><span class='text'>Back</span><span class='icon icon-chevron-left'></a>");
		}
		

		// FIX THE LINKS, SHOULD NOT HAVE A TIMEOUT :(
		var thetimer = setTimeout(function(){init();clearTimeout(thetimer);},100);
	});
	
	setTimeout(function(){
	    var iframe = $("#frame0")[0];
	    iframe.contentWindow.focus();
	}, 150);

	setHighlight(url);
}
