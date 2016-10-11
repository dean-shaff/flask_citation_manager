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
	/*
	This function get's called when the 'update' button is pressed.
	It grabs data from each of the fields in the form, updates the global json_data,
	and then posts the data to the server.
	*/
	var index = event.data.index;

	var button_cit = document.getElementById("button_"+index);
	// console.log($("button-list").get(index));
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
	// now that we have the json_data dictionary updated
	// let's update the UI elements
	$(button_cit).text(json_data[index]['title']);
	// now lets POST the data to the server so we can update 
	// the cloudant database.
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
	/*
	This callback function gets called when citation buttons are pressed. 
	It generates a form with fields corresponding to the citation data fields.
	When the update button is pressed, the data gets posted to the server using 
	the submit_handler callback.
	*/
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
    <input type="text" class="u-full-width" name="'+attrs[i].toLowerCase()+
    '" id="'+attrs[i]+'" value="'+json_data[index][attrs[i].toLowerCase()]+'"> \
   </div>')});
    }
    $('#edit_area').height("250px");
    // console.log($('#edit_area').height());
    $('#submit').empty();
    $('#submit').append(function(){
    	return $('<button>Update</button>').click({index:index},submit_handler);
    })


}

$(document).ready(function(){
	$.getJSON($SCRIPT_ROOT+"/get_citations",{},
		function(data){
			json_data = JSON.parse(data.result);
			for (var i=0; i<json_data.length; i++){
				$('#button-list').append(function(){
					var ele = $("<button id='button_"+i+"'>"+json_data[i].title+"</button>");
					return ele.click(button_handler);
				});
			}
		});

	// new Editor($("edit_area"), $("html_area"));
});


