"use strict";

$(document).ready(function() {
  var cardListItemTemplate = Handlebars.compile($("#card-template-advanced").html());
  var cardBinItemTemplate = Handlebars.compile($("#card-template").html());
  // todo: read these from html
  var jayaCurrentName = "Jaya"; var jayaFullName = "Jaya Ballard";
  var squeeCurrentName = "Squee"; var squeeFullName = "Squee Nabob";
  var currentCards = [];
  var jayaCards = [];
  var squeeCards = [];

  function getVal(ele)
  {
    return ele.val();
  }

  function displayCards()
  {
    clearCards();
    currentCards.forEach(addCard);
  }

  function clearCards()
  {
    $('#card-search-results').empty();
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
      var cardHTML = cardListItemTemplate(card);
      $('#card-search-results').append(cardHTML);
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

  function updateTradeVals()
  {
    var squeeTotal = 0; var jayaTotal = 0;
    for (var i = 0; i < squeeCards.length; i++)
    {
      squeeTotal += squeeCards[i].value * squeeCards[i].quantity;
    }
    for (var i = 0; i < jayaCards.length; i++)
    {
      jayaTotal += jayaCards[i].value * jayaCards[i].quantity;
    }
    $('#squee-total').html("$" + Number(squeeTotal).toFixed(2));
    $('#jaya-total').html("$" + Number(jayaTotal).toFixed(2));
  }

  function parseManacost(card)
  {
    card.cost = card.cost.replaceAll("/","");
    // TODO: support for phyrexian mana
    card.cost = card.cost.replaceAll("P","");
    // TODO: see if you can implement this in the template
    card.cost = card.cost.replaceAll("{", "<img src=\"img/");
    card.cost = card.cost.replaceAll("}", ".jpg\">");
  }

  $('#user-search-input').on('input', function() {
    var userInput = getVal($(this));
    if (userInput.length < 3) {
      return;
    }

    $.ajax({
      url: "https://api.deckbrew.com/mtg/cards/typeahead",
      method: 'get',
      data: {
        q: userInput
      },
      dataType: 'json',
      success: function (data) {
        currentCards = data;
        displayCards();
      }
    });
  });

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

  $('.trade-window-header .title').on('keydown', function(event) {  
    if(event.keyCode == 13) {
      event.preventDefault();
      $(this).blur();
    }
  });

  $('#card-search-results').on('click', ".set-selector", function() {
    var mid = $(this).data("id");
    var cardElement = $(this).closest(".card");
    var id = cardElement.data("id");
    var newCard = currentCards.find(x=> x.id === id);
    for (var i = 0; i < newCard.editions.length; i++)
    {
      if (newCard.editions[i].active)
      {
        delete newCard.editions[i].active;
      }
      else if (newCard.editions[i].multiverse_id == mid)
      {
        newCard.editions[i].active = true;
      }
    }
    updateUserNames(newCard);
    cardElement.replaceWith(cardListItemTemplate(newCard));
  });

  var ALT_EDIT_BTN_TEXT = "Done";
  var ORIG_EDIT_BTN_TEXT = "Edit";
  $('.cardList').on('click', '.editCardButton', function() {
    // find the card bin item this button was pushed from
    var cardBinElement = $(this).closest('.cardBin');

    // if we are already in edit mode and user pressed "done"
    if ($(this).html() === ALT_EDIT_BTN_TEXT) {
      // find the two forms
      var valForm = cardBinElement.find('.value-input');
      var quantForm = cardBinElement.find('.quantity-input');
      var valid = true;

      // find the card value from the card value form
      var cardVal = parseFloat(valForm.val());
      if (isValidValue(cardVal)) {
        valForm.removeClass('has-error');
        
      } else {
        valForm.addClass('has-error');
        valid = false;
      }

      var cardQuant = parseFloat(quantForm.val());

      if (blah) {
        $(this).html(ORIG_EDIT_BTN_TEXT);
        $(this).closest('.cardBin').find('.cardBinForm').toggle();
      }

    } else {
      $(this).closest('.cardBin').find('.cardBinForm').toggle();
      $(this).html(ALT_EDIT_BTN_TEXT);
    }
  });

  $('#card-search-results').on('click', '.addButton', function() {
    var characterFor = $(this).data('character');
    var cardHolderElement = $(this).closest(".card");
    var id = cardHolderElement.data("id");
    var card = deepClone(currentCards.find(x=> x.id === id));
    var valid = true;

    var cardVal = parseFloat(cardHolderElement.find('.value-input').val());
    if (isValidValue(cardVal))
    {
      cardHolderElement.find('.value-form').removeClass('has-error');
      card.value = cardVal;
    } else {
      cardHolderElement.find('.value-form').addClass('has-error');
      valid = false;
    }

    var cardQuant = parseFloat(cardHolderElement.find('.quantity-input').val());
    if (isValidQuantity(cardQuant))
    {
      cardHolderElement.find('.quantity-form').removeClass('has-error');
      card.quantity = cardQuant;
    } else {
      cardHolderElement.find('.quantity-form').addClass('has-error');
      valid = false;
    }

    if (!valid) return;

    card.totalVal = "$" + Number(cardQuant * cardVal).toFixed(2);

    if (characterFor === 'jaya') {
      jayaCards.push(card);
      $('#jaya-list').append(cardBinItemTemplate(card));
    } else if (characterFor === 'squee') {
      squeeCards.push(card);
      $('#squee-list').append(cardBinItemTemplate(card));
    } else {
      return;
    }
    updateTradeVals();
  });
  
});

