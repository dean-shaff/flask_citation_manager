var json_data ;
var attrs = ['Title', 'Author', 'Year', 'Org'];

marked.setOptions({
  highlight: function (code) {
    return hljs.highlightAuto(code).value;
  }
});

$('#edit_area').on('keydown', function(e){
	// $('#html_area').html("<h2>"+curEditAreaText+"</h2>");
	var keyCode = e.keyCode || e.which ; 
	if (keyCode === 9) {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;
        var val = this.value;
        var selected = val.substring(start, end);
        var re = /^/gm;
        var count = selected.match(re).length;
        this.value = val.substring(0, start) + selected.replace(re, '    ') + val.substring(end);
    	// the business below highlights the tab we just made 
        // this.selectionStart = start;
        // this.selectionEnd = end + count;
        // console.log(markdown.toHTML(text_cur));
    }
    var text_cur = $('#edit_area').val();
    $('#html_area').html(marked(text_cur));
    var html_area = document.getElementById("html_area");
    // MathJax.Hub.Queue(["Typeset",MathJax.Hub,html_area]);
});

submit_handler = function(event){
	// console.log(json_data[0]['org']);
	// var json_data_temp = {}
	var index = event.data.index;
	for (var i=0; i<attrs.length; i++){
		try{
			var ele = document.getElementById(attrs[i]);
			var cur_val = $(ele).val(); 
			if (typeof cur_val != 'undefined'){
				json_data[index][attrs[i].toLowerCase()] = cur_val;
			}
		}catch(err){
			console.log(err)
		}
	}
	json_data[index]['note'] = $('#edit_area').val();
	$.ajax({
      type: "POST",
      url: $SCRIPT_ROOT+"/get_update",
      data: JSON.stringify(json_data[index]),
      success: function(msg){
        //success method
        console.log("Message from server: "+msg);
      },
      failure: function(msg){
       //failure message
        console.log(msg);
      }
   });

}


button_handler = function(){
	var index = $(this).index();
	$('#edit_area').val(json_data[index].note);
    var text_cur = $('#edit_area').val();
    $('#html_area').html(marked(text_cur));
    $('#cit-field').empty();
    for (var i = 0; i < attrs.length ; i++){
		// console.log(json_data[0][attrs[i].toLowerCase()]);
    	$('#cit-field').append(function(){
    		return $('<div class="form-group"> \
    <label for="input-'+attrs[i]+'"+>'+attrs[i]+'</label> \
    <input type="text" class="form-control" name="'+attrs[i].toLowerCase()+
    '" id="'+attrs[i]+'" placeholder="'+json_data[index][attrs[i].toLowerCase()]+'"> \
   </div>')});
    }
    $('#submit').empty();
    $('#submit').append(function(){
    	return $('<button type="button" class="btn">Update</button>').click({index:index},submit_handler);
    })


}

$(document).ready(function(){
	$.getJSON($SCRIPT_ROOT+"/get_citations",{},
		function(data){
			json_data = JSON.parse(data.result);
			for (var i=0; i<json_data.length; i++){
				$('.list-group').append(function(){
					return $("<button type='button' class='list-group-item'>"+json_data[i].title+"</button>").click(button_handler);
				});
			}
		});
	// new Editor($("edit_area"), $("html_area"));
});


