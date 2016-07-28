"use strict";
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function isValidValue(n) {
  return !isNaN(parseFloat(n)) && isFinite(n) && (n >= 0);
}

function isValidQuantity(n) {
  return Number.isInteger(n) && (n > 0);
}

function deepClone(obj) {
  var copy;

  // Handle the 3 simple types, and null or undefined
  if (null == obj || "object" != typeof obj) return obj;

  // Handle Date
  if (obj instanceof Date) {
    copy = new Date();
    copy.setTime(obj.getTime());
    return copy;
  }

  // Handle Array
  if (obj instanceof Array) {
    copy = [];
    for (var i = 0, len = obj.length; i < len; i++) {
      copy[i] = deepClone(obj[i]);
    }
    return copy;
  }

  // Handle Object
  if (obj instanceof Object)
  {
    copy = {};
    for (var attr in obj) {
      if (obj.hasOwnProperty(attr)) copy[attr] = deepClone(obj[attr]);
    }
    return copy;
  }

  throw new Error("Unable to copy obj, its type or the type of objects it contains is not supported.");
}

$(document).ready(function() {
  var cardListItemTemplate = Handlebars.compile($("#card-template-advanced").html());
  var cardBinItemTemplate = Handlebars.compile($("#card-template").html());
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
      card.editions[0].active = true;
      $('#card-search-results').append(cardListItemTemplate(card));
    }
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
    card.cost = card.cost.replaceAll("P","");
    card.cost = card.cost.replaceAll("{", "<img src=\"img/");
    card.cost = card.cost.replaceAll("}", ".jpg\">");
  }

  $('#user-search-input').on('input', function() {
    var userInput = getVal($(this));
    if (userInput.length < 3)
    {
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
        // console.log("success!");
        currentCards = data;
        displayCards();
      }
    });
  });

  $('#card-search-results').on('click', ".set-selector", function() {
    var mid = $(this).data("id");
    var cardElement = $(this).closest(".card")
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
    cardElement.replaceWith(cardListItemTemplate(newCard));
  });

  $('#card-search-results').on('click', '.addButton', function() {
    var characterFor = $(this).data('character');
    var cardHolderElement = $(this).closest(".card")
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

