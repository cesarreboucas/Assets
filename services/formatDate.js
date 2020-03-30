function formatDate(date) {
    var monthNames = [ "",
      "Jan", "Fev", "Mar",
      "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set",
      "Out","Nov", "Dez"
    ];
  
    var day = date.getDate();
    var monthNum = (date.getMonth()+1);
    var year = date.getFullYear();
  
    return day + ' ' + monthNames[monthNum] + ' ' + year;
  }

  module.exports.formatDate = formatDate;
  