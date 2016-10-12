var json_data ;
var attrs = ['title', 'author', 'year', 'org'];
var empty_form = {
	'title':"",
	'author':"",
	'year':"",
	'org':""
}
marked.setOptions({
  highlight: function (code) {
    return hljs.highlightAuto(code).value;
  }
});

tab_render = function(e){
	/*
	This function makes it so the edit area can render tabs, which end up being 
	4 spaces.
	*/
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
};

add_edit_area = function(start_text){
	/*
	This function just sets up the edit area. Note that it doesn't fill in the data!
	args:
		- start_text (optional): This will render some starting text
	*/
    $('#cit-field').append(function(){
    	var ele = $('<label for="input">Note</label> \
			<textarea class="u-full-width" id="edit_area"></textarea>');
    	return ele;
    });
    $('#edit_area').height("250px");
    $('#edit_area').on('keydown', tab_render);
    if (start_text != 'undefined'){
    	try{
			$('#edit_area').val(start_text);
		    $('#html_area').html(marked(start_text));
		}catch(err){
			console.log(err);
		}
    }
}

add_citation_fields = function(form_info){
	/*
	Given some information about fields 
	(the name of the field and any data within that field)
	this function will fill in the #cit-field div with fields.
	args:
		- form_info: a dictionary whose keys correspond to 
			form labels, and whose values are the starter text 
			for the form.
	*/
	var keys = Object.keys(form_info);
	for (var i=0; i<keys.length;i++){
		if (keys[i] != 'note' && keys[i] != '_id' && keys[i] != '_rev' && keys[i] != 'edit_area'){
			$("#cit-field").append(function(){
				var val = form_info[keys[i]]
				var lab = "<label for='input'>"+keys[i]+"</label>";
				var input = "<input type='text' class='u-full-width' name='"+keys[i]+
				"'id='"+keys[i]+"'value='"+val+"'>";
				var new_div = lab + input ;
				return $(new_div);
			});
		}
	}
}

manual_handler = function(event){
	/*
	This function get's called when the 'update' button is pressed.
	It grabs data from each of the fields in the form, updates the global json_data,
	and then posts the data to the server.
	*/
	var index = event.data.index;
	if (index == json_data.length){
		console.log("Adding new entry");
		// var entry = {};
		// for (var i=0; i<attrs.length; i++){
		// 	var low_attr = attrs[i].toLowerCase();
		// 	entry[low_attr] = "";
		// }	
		// entry["note"] = "note";
		json_data.push({});
		$("#button-list").append(function(){
			var ele = $("<button class='u-full-width' id='button_"+index+"'>"+json_data[index].title+"</button>");
			return ele.on('click',citation_button_handler)
		});
	}
	var button_cit = document.getElementById("button_"+index);
	var form_content = $("#cit-field .u-full-width");
	for (var i=0 ; i<form_content.length; i++){
		var ele = $(form_content)[i];
		var ele_id = $(ele).attr('id');
		if (ele_id == 'edit_area'){
		}else{
			var ele_val = $(ele).val();
			json_data[index][ele_id] = ele_val;
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

process_arxiv_data = function(msg){
	/*
	Given some data from an arxiv article, populate the form column.
	*/
	$("#cit-field").empty()
	$("#submit").empty()
	add_citation_fields(arxiv_data)
	add_edit_area()
	$("#submit").append(function(){
		return $('<button>Update</button>').click({index:json_data.length},manual_handler); 
	})
}

arxiv_handler = function(){

	var arxiv_url = $("#arxiv_entry").val();
	$.ajax({
		type:"POST",
		url: $SCRIPT_ROOT+"/get_arxiv",
		data : JSON.stringify(arxiv_url),
		success: function(msg){
			process_arxiv_data(msg);
		},
		failure: function(msg){
			console.log("Failure message from server: "+msg);
		}
	});
}

citation_button_handler = function(){
	/*
	This callback function gets called when citation buttons are pressed. 
	It generates a form with fields corresponding to the citation data fields.
	When the update button is pressed, the data gets posted to the server using 
	the submit_handler callback.
	*/
	var add_cit_size = $("#add_cit option").size();
	var index = $(this).index() - add_cit_size; // this is because we have the add button now.
    $('#cit-field').empty();
    add_citation_fields(json_data[index]);
    add_edit_area(json_data[index].note);
    // console.log($('#edit_area').height());
    $('#submit').empty();
    $('#submit').append(function(){
    	return $('<button>Update</button>').click({index:index},manual_handler);
    })
}

add_handler = function(){
	/*
	This function gets called when the add citation button is pressed.
	*/
	var index = json_data.length;
	var cur_val = $("#add_cit").val();
	if (cur_val == 'add_manual'){
		$("#cit-field").empty();
		add_citation_fields(empty_form);
		add_edit_area();
		// $('#edit_area').val(json_data[index].note);
	    $('#submit').empty();
	    $('#submit').append(function(){
	    	return $('<button>Create New Entry</button>').click({index:index},manual_handler);
	    })
	}else if (cur_val == 'add_arxiv'){
		// $("html_area").html();
		$("#cit-field").empty();
		$("#cit-field").append(function(){
			var lab = "<label for='input'>Arxiv URL<label>";
			var input = "<input type='text' class='u-full-width' id='arxiv_entry' value=''>"
			var new_div = lab + input;
			return $(new_div);
		});
		$('#submit').empty();
		$('#submit').append(function(){
	    	return $('<button>Grab Arxiv article info</button>').click({index:index},arxiv_handler);
	    })

	}

}

$(document).ready(function(){
	$.getJSON($SCRIPT_ROOT+"/get_citations",{},
		function(data){ 
			json_data = JSON.parse(data.result);
			$('#button-list').append(function(){
				var ele = $("<select class='button-full' id='add_cit'> \
						<option value='add_manual'>Add Manually</option> \
						<option value='add_arxiv'>Add by Arxiv URL</option> \
					</select>");
				return ele.on("click",add_handler);
			});
			$('#button-list').append('<hr>');
			for (var i=0; i<json_data.length; i++){
				$('#button-list').append(function(){
					var ele = $("<button class='u-full-width' id='button_"+i+"'>"+json_data[i].title+"</button>");
					return ele.click(citation_button_handler);
				});
			}
		});

	// new Editor($("edit_area"), $("html_area"));
});


