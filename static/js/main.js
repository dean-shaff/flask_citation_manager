$('#edit_area').on('keydown', function(e){
	var curEditAreaText = this.value;
	$('#html_area').html("<h2>"+curEditAreaText+"</h2>");

	var keyCode = e.keyCode || e.which ; 
	    if (keyCode === 9) {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        var val = this.value;
        var selected = val.substring(start, end);
        var re = /^/gm;
        var count = selected.match(re).length;
        this.value = val.substring(0, start) + selected.replace(re, '\t') + val.substring(end);
        this.selectionStart = start;
        this.selectionEnd = end + count;
    }
});

$(function(){
	$('.list-group button').click(function(){
		var index = $(this).index();
		
	});
});
// $(document).ready(function(){
// 	$.get("https://dshaff001.cloudant.com/citation_manager/0", function(data){
// 			$('#html_area').html(data);
// 			alert("Load completed")
// 		}
// 	);
// });