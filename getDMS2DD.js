function getDMS2DD(days, minutes, seconds, direction) {
  direction.toUpperCase();
  var dd = days + minutes / 60 + seconds / (60 * 60);
  //alert(dd);
  if (direction == "S" || direction == "W") {
    dd = dd * -1;
  } // Don't do anything for N or E
  return dd;
}

console.log(getDMS2DD(38, 53, 55, "N"));
console.log(getDMS2DD(77, 2, 16, "E"));
