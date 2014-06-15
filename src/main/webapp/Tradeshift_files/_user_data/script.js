$(document).ready(function(){
	init();

	$("#menu-contextual a").live("click",function(e) {
		$("#menu-contextual a").removeClass("active");
		$(this).addClass("active");
		$(".pagepanel").hide();
		$("#"+$("#menu-contextual a.active").data("panel")).show();
		e.stopPropagation();
		return false;
	});
	$("#menu-contextual a.active").click();
	
	$("a.setuserimage[data-img='"+$("#employee_image").val()+"']").addClass("active");
	$("a.setuserimage").live("click",function(){
		$("a.setuserimage").removeClass("active");
		$(this).addClass("active");
		var img = ($(this).data("img"));
		$("input#employee_image").val(img).focus().blur();
	});
	
	setTimeout(function(){init();}, 500);
});
