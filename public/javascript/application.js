"use strict";

$(document).ready(function() {
  // compile handlebars templates
  var cardListItemTemplate = Handlebars.compile($("#card-template-advanced").html());
  var cardBinItemTemplate = Handlebars.compile($("#card-template").html());

  // read names from html
  var jayaFullName = $('.trade-window.left .title').html();
  var squeeFullName = $('.trade-window.right .title').html();
  var jayaCurrentName = shortenName(jayaFullName.stripSpecialChars());
  var squeeCurrentName = shortenName(squeeFullName.stripSpecialChars());

  // initialize card arrays
  var currentSearchCards = [];
  var jayaCards = []; var jayaIndex = 0;
  var squeeCards = []; var squeeIndex = 0;

  // used to order our search's ajax requests
  var searchReqIndex = 0; var latestReturnedIndex = 0;

  function clearCards() {
    $('#card-search-results').empty();
  }

  function displayCards()
  {
    clearCards();
    currentSearchCards.forEach(addCard);
  }

  function addCard(card, index, array)
  {
    parseEditions(card);
    if ((!jQuery.isEmptyObject(card.formats)) && (card.editions.length > 0))
    {
      parseManacost(card);
      parseType(card);
      updateUserNames(card);
      card.editions[0].active = true;
      $('#card-search-results').append(cardListItemTemplate(card));
    }
  }

  function updateUserNames(card)
  {
    card.jayaName = jayaCurrentName;
    card.squeeName = squeeCurrentName;
  }

  function parseType(card)
  {
    var typeStr = "";
    for (var i = 0; i < card.types.length; i++)
    {
      typeStr += card.types[i].capitalizeFirstLetter();
      typeStr += " ";
    }
    card.type = typeStr.trimRight();
  }

  function parseEditions(card)
  {
    for (var i = 0; i < card.editions.length; i++)
    {
      if (card.editions[i].multiverse_id === 0)
      {
        card.editions.splice(i,1);
        i--;
      }
    }
  }

  function parseManacost(card)
  {
    card.cost = card.cost.replaceAll("/","");
    // TODO: add support for phyrexian mana
    card.cost = card.cost.replaceAll("P","");
    // TODO: move this view logic to the template
    card.cost = card.cost.replaceAll("{", "<img src=\"img/");
    card.cost = card.cost.replaceAll("}", ".jpg\">");
  }

  // function for updating trade vals, input is boolean true => update jaya's
  // trade vals or false => update squee's trade vals
  function updateTradeVals(jaya)
  {
    // TODO: change to be dry, update squee or jaya only instead of repeating all code twice
    var squeeTotal = 0; var jayaTotal = 0;
    for (var i = 0; i < squeeCards.length; i++)
      squeeTotal += squeeCards[i].value * squeeCards[i].quantity;
    for (var i = 0; i < jayaCards.length; i++)
      jayaTotal += jayaCards[i].value * jayaCards[i].quantity;
    $('#squee-total').html(Number(squeeTotal).toFixed(2));
    $('#jaya-total').html(Number(jayaTotal).toFixed(2));

    // we need to also update the relative quantities
    var squeeBalance = squeeTotal - jayaTotal;
    var jayaBalance = jayaTotal - squeeTotal;
    var squeeString = "$" + Number(Math.abs(squeeBalance)).toFixed(2);
    var jayaString = "$" + Number(Math.abs(jayaBalance)).toFixed(2);
    // TODO: consider refactoring all this view logic into a handlebar template?
    if (squeeBalance < 0) {
      squeeString = "-" + squeeString;
      $('#squee-balance').css('color','red');
    } else {
      squeeString = "+" + squeeString;
      $('#squee-balance').css('color','green');
    }
    if (jayaBalance < 0) {
      jayaString = "-" + jayaString;
      $('#jaya-balance').css('color','red');
    } else {
      jayaString = "+" + jayaString;
      $('#jaya-balance').css('color','green');
    }

    $('#squee-balance').html(squeeString);
    $('#jaya-balance').html(jayaString);
  }

  // functionality for users changing their names
  $('.trade-window-header .title').on('focusout', function() {
    var fullName = $(this).html().stripSpecialChars();
    var newName = shortenName(fullName);
    var whoFor = $(this).data("for");
    if (whoFor === 'jaya') {
      jayaCurrentName = newName;
      jayaFullName = fullName;
      $('.addButton-name-jaya').html(newName);
    } else if (whoFor === 'squee') {
      squeeCurrentName = newName;
      squeeFullName = fullName;
      $('.addButton-name-squee').html(newName);
    }
    $(this).html(fullName);
  });

  // making the name field lose focus when user presses enter
  $('.trade-window-header .title').on('keydown', function(event) {  
    if(event.keyCode == 13) {
      // prevent the enter from registering as well
      event.preventDefault();
      $(this).blur();
    }
  });

  // functionality for switching the set version of cards in search results
  $('#card-search-results').on('click', ".set-selector", function() {
    var mid = $(this).data("id");
    var cardElement = $(this).closest(".card");
    var id = cardElement.data("id");
    var newCard = currentSearchCards.find(x=> x.id === id);
    for (var i = 0; i < newCard.editions.length; i++)
    {
      if (newCard.editions[i].active) {
        delete newCard.editions[i].active;
      } else if (newCard.editions[i].multiverse_id == mid) {
        newCard.editions[i].active = true;
      }
    }
    updateUserNames(newCard);
    cardElement.replaceWith(cardListItemTemplate(newCard));
  });

  // hacking in this functionality to let enter work as button press for the 
  // finished editing button on card bins, since it is not in an actual form
  $('.cardList').on('keydown', '.cardBinForm input', function(event) { 
    if(event.keyCode == 13) {
      $(this).closest('.cardBin').find('.editCardButton').trigger('click');
    }
  });

  // functionality for the hide search results button
  var ORIG_HIDE_BTN_TXT = "Hide";
  var ALT_HIDE_BTN_TXT = "Unhide";
  $('#hide-search-results-button').on('click', function() {
    // only run if the search input is not empty
    if ($('#user-search-input').val()) {
      $('#card-search-results').toggle();
      ($(this).html() == ORIG_HIDE_BTN_TXT) ? $(this).html(ALT_HIDE_BTN_TXT) : $(this).html(ORIG_HIDE_BTN_TXT);
    }
  });

  // functionality for editing (val, quantity) cards in user bins
  var ALT_EDIT_BTN_TEXT = "Done";
  var ORIG_EDIT_BTN_TEXT = "Edit";
  $('.cardList').on('click', '.editCardButton', function() {
    // find the card bin item this button was pushed from
    var cardBinElement = $(this).closest('.cardBin');

    // if we are already in edit mode and user pressed "done"
    if ($(this).html() === ALT_EDIT_BTN_TEXT) {
      // find the two forms
      var valForm = cardBinElement.find('.value-input');
      var valFormDiv = cardBinElement.find('.value-form');
      var quantForm = cardBinElement.find('.quantity-input');
      var quantFormDiv = cardBinElement.find('.quantity-form');
      var valid = true;

      // find the card value from the card value form
      var cardVal = parseFloat(valForm.val());
      if (isValidValue(cardVal)) {
        valFormDiv.removeClass('has-error');
        valFormDiv.find('.input-group-addon').removeClass('has-error');
      } else {
        valFormDiv.addClass('has-error');
        valFormDiv.find('.input-group-addon').addClass('has-error');
        valid = false;
      }

      // find the card quantity from the card quantity form
      var cardQuant = parseFloat(quantForm.val());
      if (isValidQuantity(cardQuant)) {
        quantFormDiv.removeClass('has-error');
        quantFormDiv.find('.input-group-addon').removeClass('has-error');
      } else {
        quantFormDiv.addClass('has-error');
        quantFormDiv.find('.input-group-addon').addClass('has-error');
        valid = false;
      }

      // if the inputs are valid, we are actually going to commit this data change
      if (valid) {
        // figure out if we are in jaya's or squee's list
        var forJaya = ($(this).closest('.cardList.list-group').data('for')) == 'jaya';
        // find the card in our array
        var card;
        if (forJaya)
          card = $.grep(jayaCards, function(e){ return e.index == cardBinElement.data('index'); });
        else
          card = $.grep(squeeCards, function(e){ return e.index == cardBinElement.data('index'); });
        card = card[0];
        // set the new card value and quantity
        card.value = cardVal;
        card.valPrint = Number(cardVal).toFixed(2);
        card.quantity = cardQuant;
        card.totalVal = "$" + Number(cardQuant * cardVal).toFixed(2);

        // rebuild this card element
        cardBinElement.replaceWith(cardBinItemTemplate(card));
        // update trade vals
        updateTradeVals(forJaya);
      }
    // else if we are not in edit mode, we enable edit mode
    } else {
      // TODO: use cardBinElement var below::::
      cardBinElement.find('.cardBinForm').toggle();
      $(this).html(ALT_EDIT_BTN_TEXT);
      cardBinElement.find('.cancelEditCardButton').toggle();
    }
  });

  // functionality for using the search bar
  $('#user-search-input').on('input', function() {
    var userInput = $(this).val();
    if (userInput.length < 3) {
      clearCards();
      $('#hide-search-results-button').html(ORIG_HIDE_BTN_TXT);
      return;
    }

    // unhide search results
    $('#hide-search-results-button').html(ORIG_HIDE_BTN_TXT);
    $('#card-search-results').toggle(true);
    searchReqIndex++;
    $.ajax({
      url: "https://api.deckbrew.com/mtg/cards/typeahead",
      method: 'get',
      data: {
        q: userInput
      },
      dataType: 'json',
      success: debounce(function (data) {
        if (this > latestReturnedIndex) {
          latestReturnedIndex = this;
          currentSearchCards = data;
          displayCards();
        }
      }, 300).bind(searchReqIndex)
    });
  });

  $('.cardList').on('click', '.cancelEditCardButton', function() {
    // find the card bin item this button was pushed from
    $(this).closest('.cardBin').find('.editCardButton').html(ORIG_EDIT_BTN_TEXT);
    // toggle off the form
    $(this).closest('.cardBin').find('.cardBinForm').toggle(false);
    // toggle off this button
    $(this).toggle(false);
  });

  // functionality for adding cards to users' bins
  $('#card-search-results').on('click', '.addButton', function() {
    var characterFor = $(this).data('character');
    var cardHolderElement = $(this).closest(".card");
    var id = cardHolderElement.data("id");
    var card = deepClone(currentSearchCards.find(x=> x.id === id));
    var valid = true;

    var cardVal = parseFloat(cardHolderElement.find('.value-input').val());
    var valFormEle = cardHolderElement.find('.value-form');
    if (isValidValue(cardVal))
    {
      valFormEle.removeClass('has-error');
      valFormEle.find('.input-group-addon').removeClass('has-error');
      card.value = cardVal;
      card.valPrint = Number(cardVal).toFixed(2);
    } else {
      valFormEle.addClass('has-error');
      valFormEle.find('.input-group-addon').addClass('has-error');
      valid = false;
    }

    var cardQuant = parseFloat(cardHolderElement.find('.quantity-input').val());
    var quantFormEle = cardHolderElement.find('.quantity-form');
    if (isValidQuantity(cardQuant))
    {
      quantFormEle.removeClass('has-error');
      quantFormEle.find('.input-group-addon').removeClass('has-error');
      card.quantity = cardQuant;
    } else {
      quantFormEle.addClass('has-error');
      quantFormEle.find('.input-group-addon').addClass('has-error');
      valid = false;
    }

    if (!valid) return;

    card.totalVal = "$" + Number(cardQuant * cardVal).toFixed(2);

    if (characterFor === 'jaya') {
      card.index = jayaIndex++;
      jayaCards.push(card);
      $('#jaya-list').append(cardBinItemTemplate(card));
      updateTradeVals(true);
    } else {
      card.index = squeeIndex++;
      squeeCards.push(card);
      $('#squee-list').append(cardBinItemTemplate(card));
      updateTradeVals(false);
    }
  });

  // functionality for removing cards from users' bins
  var ALT_REMOVE_BTN_TXT = "Sure?";
  var ORIG_REMOVE_BTN_TXT = "Remove";
  $('.cardList').on('click', '.deleteCardButton', function() {
    // find the card bin item this button is associated with
    var cardBinElement = $(this).closest('.cardBin');

    // see if we are past the "sure?" prompt
    if ($(this).html() == ALT_REMOVE_BTN_TXT) {
      // figure out if we are in jaya's or squee's list
      var forJaya = ($(this).closest('.cardList.list-group').data('for')) == 'jaya';
      // find the card in the relevant array and delete it
      var arrayToSearch;
      if (forJaya) arrayToSearch = jayaCards; else arrayToSearch = squeeCards;
      for (var i = 0; i < arrayToSearch.length; i++) {
        if (arrayToSearch[i].index === cardBinElement.data('index')) {
          arrayToSearch.splice(i,1);
          i--;
        }
      }
      // remove this element entirely
      cardBinElement.remove();
      updateTradeVals(forJaya);
    } else {
      $(this).removeClass('btn-default');
      $(this).addClass('btn-danger');
      $(this).html(ALT_REMOVE_BTN_TXT)
      setTimeout(function() {
        this.addClass('btn-default');
        this.removeClass('btn-danger');
        this.html(ORIG_REMOVE_BTN_TXT);
      }.bind($(this)), 3000);
    }
  });

  // functionality for clearing one of the bins
  var ALT_CLEAR_BTN_TXT = "Sure?";
  var ORIG_CLEAR_BTN_TXT = "Clear";
  $('.clearBinButton').on('click', function() {
    // find out if we are button for jaya or for squee
    var forJaya = $(this).closest('.trade-window.left').data('for') == "jaya";

    // do nothing if the bin is empty
    if (forJaya && jayaCards.length === 0) return;
    if (!forJaya && squeeCards.length === 0) return;

    // check if we are past the "sure?" prompt
    if ($(this).html() == ALT_CLEAR_BTN_TXT) {
      // clear the list
      if (forJaya) {
        $('#jaya-list').empty();
        jayaCards.length = 0;
        jayaIndex = 0;
      } else {
        $('#squee-list').empty();
        squeeCards.length = 0;
        squeeIndex = 0;
      }
      // clear the trade value
      updateTradeVals(forJaya);
      // reset this button
      $(this).addClass('btn-default');
      $(this).removeClass('btn-danger');
      $(this).html(ORIG_CLEAR_BTN_TXT);
    }
    // otherwise we just switch to prompt version of this button for 3 seconds
    else {
      $(this).removeClass('btn-default');
      $(this).addClass('btn-danger');
      $(this).html(ALT_CLEAR_BTN_TXT)
      setTimeout(function() {
        this.addClass('btn-default');
        this.removeClass('btn-danger');
        this.html(ORIG_CLEAR_BTN_TXT);
      }.bind($(this)), 3000);
    }
  });
  
});
