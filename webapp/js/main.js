/*
 * This file is part of "photo-booth"
 * Copyright (c) 2018 Philipp Trenz
 *
 * For more information on the project go to
 * <https://github.com/philipptrenz/photo-booth>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var socket = io();

var useGrayscale = false;

$(document).ready(function() {

	$('body').fadeIn(800);

	if (!document.cookie.includes('showContactWindow')) {
		setTimeout(function() {
			$('#contact-window').slideDown('slow');
			$('#contact').focus();
		}, 1500);
	}
});


// request latest image from the server
socket.emit('get latest photos');



// send contact address
$('#contact-form').submit(function(){

	// send to server
	socket.emit('contact address', $('#contact-address').val());

	$('#contact-window').slideUp('slow');
	$('#contact-address').val('');
	setCookie('showContactWindow','false', 3);
	return false;
});

// ------------------------------------------------- //

function closeWindow(string) {
	$(string).slideUp('slow');
	if (string == '#contact-window') {
		setCookie('showContactWindow','false', 3);
	}
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(name) {
	try {
		var value = "; " + document.cookie;
		var parts = value.split("; " + name + "=");
		if (parts.length == 2) return parts.pop().split(";").shift();
	} catch(err) {
		return false;
	}
}

// ------------------------------------------------- //


function showSettings() {

	if (getCookie('password')) {

		window.location.href = "config.html";

	} else {
		if ($('.wrapper').hasClass('show-settings')) {
				$('.wrapper').removeClass('show-settings');
				$('#settings-button').removeClass('fa-arrow-left'); //
				$('#settings-button').addClass('fa-cog');
			} else {
				$('#settings-auth').slideDown('slow');
				$('#passwd').focus();
			}
	}
}

function triggerPhoto() {
	showPendingActionPage();
	socket.emit('trigger_photo');
}

$('#auth-form').submit(function(){
		console.log('send password to server for validation');
	// send to server
	socket.emit('authenticate', $('#passwd').val());
	setCookie('password',$('#passwd').val(), 3);
	$('#passwd').val('');
	});

	socket.on('authenticated', function(bool){

		console.log('authentification is '+(bool? 'correct':'wrong'));

	if (bool) {
		if (!$('.wrapper').hasClass('show-settings')) {
				window.location.href = "config.html";
			}
	} else {
		// delete cookie
		setCookie('password','', 3);
	}
	closeWindow('#settings-auth');
});

// ------------------------------------------------- //

socket.on('use grayscale', function() {
	$('head').append('<link rel="stylesheet" type="text/css" href="css/grayscale.css">');
	useGrayscale = true;
});

socket.on('enable remote release', function() {
	$('#trigger-button').removeClass('hide');
	$('.my-trigger-button').removeClass('hidden-xs')
	$('.my-brand').addClass('hidden-xs');
});

socket.on('new photos', function(imgUrlArray) {
	for (i = 0; i < imgUrlArray.length; i++) {
		var url = imgUrlArray[i];
		var html = '<li class="col-xs-12 col-sm-6 col-sm-6 col-lg-4">'+
	    		'<div class="image">'+
					'<img src="'+url+'">'+
					'<div class="triangle"></div>' +
	    			'<div class="overlay">'+
	    				'<a href="#" class="img-download" download><i class="fa fa-download" aria-hidden="true"></i></a>'+
	    				//'<a href=""><i class="fa fa-share" aria-hidden="true"></i></a>'+
	    			'</div>'+
	    		'</div>'+
	    	'</li>';
		$('#photos').prepend(html);
	}
});

socket.io.on("connect_error", function(err) {
	console.log('connection error '+err)
});


// ------------------------------------------------- //

$(document).on("click", 'a.img-download', function(event) {
	event.preventDefault();

	var img = $(this).parents().eq(2).find('img')[0];
	var path = $(img).attr('src');

	// request edited image from server
	showPendingActionPage();
	socket.emit('get_download_image', path, useGrayscale);
});

(function() {
	var selectedImages = [];

	$(document).on('click', '#photos img', function(event) {
		var img = $(event.target);
		var source = img.attr('src');

		var imageContainer = img.parent('.image');

		var selectedIndex = selectedImages.indexOf(source);
		if (selectedIndex === -1) {
			selectedImages.push(source);
			imageContainer.addClass('selected');
		} else {
			selectedImages.splice(selectedIndex, 1);
			imageContainer.removeClass('selected');
		}

		$('.my-gif-button i').toggleClass('hide', selectedImages.length < 2);
	});

	$('.my-gif-button').click(function() {
		showPendingActionPage();
		socket.emit('get_download_gif', selectedImages, useGrayscale);
	});
})();

socket.on('get_download_image', downloadImage);
socket.on('get_download_gif', downloadImage);

function downloadImage(path) {
	hidePendingActionPage();

	// hack to force downloading image instead of opening in browser
	var a = document.createElement('A');
	a.href = path;
	a.download = path.substr(path.lastIndexOf('/') + 1);
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

socket.on('trigger_photo_success', hidePendingActionPage);
socket.on('trigger_photo_error', showPendingActionPageError);
socket.on('get_download_image_error', showPendingActionPageError);
socket.on('get_download_gif_error', showPendingActionPageError);

function showPage(name = 'default-page') {
	var allContainers = $('.wrapper .container');
	allContainers.not('#' + name).slideUp('slow');
	allContainers.filter('#' + name).slideDown('slow');

	var actionButtons = $('.action-buttons a, .my-back-button');
	if (name == 'default-page') {
		actionButtons.show();
	} else {
		actionButtons.hide();
	}
}

var pendingActionPage = $('#pending-action-page');
function showPendingActionPage() {
	pendingActionPage.find('h3').hide().filter('.pending').show();
	pendingActionPage.find('p').show();
	pendingActionPage.find('.alert').hide();
	pendingActionPage.find('.input-group-btn, .close-button').hide();

	showPage('pending-action-page');
}

function hidePendingActionPage() {
	showPage();
}

function showPendingActionPageError(type = 'default') {
	pendingActionPage.find('h3').hide().filter('.error').show();
	pendingActionPage.find('p').hide();
	pendingActionPage.find('.alert.type-' + type).show();
	pendingActionPage.find('.input-group-btn, .close-button').show();
}

// ------------------------------------------------- //

var layout = '';
var selectedPhotos = [];

var printPage = $('#print-page');
function openPrintPage(limitPerUser) {
	var printCount = getCookie('printCount');
	printCount = printCount == null ? 0 : parseInt(printCount);
	if (limitPerUser > 0 && printCount >= limitPerUser && getCookie('password') == null) {
		showPendingActionPage();
		showPendingActionPageError('print_limit_exceeded');
		return;
	}

	layout = '';
	selectedPhotos = [];

	showPrintStep('layout-selection');
	showPage('print-page');
}

function hidePrintPage() {
	showPage();
}

function selectPrintLayout(layoutName, width = 1, height = 1) {
	layout = layoutName;

	printPage.find('.count-selected').text(0);
	printPage.find('.count-total').text(width * height);

	var photoContainer = printPage.find('ul.photo-selection');
	photoContainer.empty();

	var images = $('#photos img').get();

	for (var i = 0; i < images.length; i++) {
		var img = images[i];

		var item = $('<li class="col-xs-12 col-sm-6 col-sm-6 col-lg-4"><img /></div>');
		item.click(selectPrintPhoto);
		var newImg = item.find('img');
		newImg.attr('src', $(img).attr('src'));

		photoContainer.append(item);
	}

	showPrintStep('photo-selection');
}

function selectPrintPhoto() {
	var item = $(this);
	var src = item.find('img').attr('src');

	var index = selectedPhotos.indexOf(src);
	if (index === -1) {
		selectedPhotos.push(src);
		item.addClass('selected');
	} else {
		selectedPhotos.splice(index, 1);
		item.removeClass('selected');
	}

	printPage.find('.count-selected').text(selectedPhotos.length);
	var continueButton = printPage.find('.step.photo-selection.btn-primary');

	if (selectedPhotos.length > 0) {
		continueButton.show();
	} else {
		continueButton.hide();
	}
}

function goToPrintPreview() {
	printPage.find('.preview-container').empty();

	showPrintStep('preview');

	socket.emit('print_preview', layout, selectedPhotos);
}

function goBackToPrintLayoutSelection() {
	showPrintStep('layout-selection');
}

function goBackToPrintPhotoSelection() {
	showPrintStep('photo-selection');
	printPage.find('.step.photo-selection.btn-primary').show();
}

function printPhoto() {
	showPendingActionPage();

	var printCount = getCookie('printCount');
	var password = getCookie('password');
	socket.emit('print', layout, selectedPhotos, printCount, password);
}

function showPrintStep(step) {
	var stepContent = printPage.find('.step').hide();

	stepContent
		.filter('.step.' + step)
		.not('.btn-primary').show();
}

socket.on('print_preview_success', function(image) {
	var previewImage = $('<img />');
	previewImage.attr('src', image);

	var previewContainer = printPage.find('.preview-container');
	previewContainer.append(previewImage);

	printPage.find('.step.preview.btn-primary').show();
});

socket.on('print_preview_error', function() {
	showPendingActionPage();
	showPendingActionPageError();
});

socket.on('print_success', function() {
	hidePendingActionPage();

	var printCount = getCookie('printCount');
	if (printCount == null) {
		printCount = 1;
	} else {
		printCount = parseInt(printCount) + 1;
	}
	setCookie('printCount', printCount, 3);
});

socket.on('print_error', function(errorType) {
	if (errorType === 'print_limit_exceeded') {
		showPendingActionPageError(errorType);
	} else {
		showPendingActionPageError();
	}
});
