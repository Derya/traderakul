"use strict";
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

$(document).ready(function() {
  var cardListItemTemplate = Handlebars.compile($("#card-template-advanced").html());

  function getVal(ele)
  {
    return ele.val();
  }

  function displayData(cards)
  {
    $('.card-search-results').empty();
    cards.forEach(addCard);
  }

  function addCard(card, index, array)
  {
    parseEditions(card);
    if ((!jQuery.isEmptyObject(card.formats)) && (card.editions.length > 0))
    {
      parseManacost(card);
      var html = cardListItemTemplate(card);
      $('.card-search-results').append(html);
    }
  }

  function parseEditions(card)
  {
    for (var i = 0; i < card.editions.length; i++)
    {
      console.log("hi");
      console.log(card.editions.length);
      if (card.editions[i].multiverse_id === 0)
      {
        console.log("killing a bad edition");
        card.editions.splice(i,1);
        i--;
      }
    }
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
        displayData(data);
      },
      error: function (err) {
        // console.log("there was an error");
      }
    });
  });
  
});

