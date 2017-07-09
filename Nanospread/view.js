function View() {
    this.offsetx = 0;
    this.offsety = 0;
    this.grid = [];

    for(var col = 0; col < theGrid.length; col++) {
        this.grid[col] = [];
        for (var row = 0; row < theGrid[col].length; row++) {
            if(!theGrid[col][row]) {
                continue;
            }
            var elem = document.createElement("div");
            var rowSize = 700 / 13;
            var rectStartX = col*rowSize + this.offsetx + 30;
            var rectStartY = row*rowSize + this.offsety + 30;
            elem.innerHTML =
                "<div class='naniteSquare' style='left:"+rectStartX+"px;top:"+rectStartY+"px;width:"+(rowSize-10)+"px;height:"+(rowSize-10)+"px;' onclick='clickedSquare("+col+","+row+")'>" +
                    "<div class='displayNum' id='displayNumcol"+col+"row"+row+"'>" +
                    "</div>" +
                "</div>";
            document.getElementById('naniteGrid').appendChild(elem);
            this.grid[col][row] = elem.firstChild;
        }
    }

    this.drawButtons = function() {
        buttonSetup('nanite', 'Nanites', 'Nanites');
        buttonSetup('advBot', 'AdvBots', 'Adv Robots');
    };

    this.setSelectedFalse = function() {
        for(var i = 0; i < selected.length; i++) {
            selected[i].isSelected = 0;
            this.changeBorderSelected(selected[i]);
        }
    };
    this.changeBorderColors = function() {
        for(var i = 0; i < selected.length; i++) {
            this.changeBorderSelected(selected[i]);
        }
        changeBordersOfLowest(this.grid);
    };
    this.changeBorderSelected = function(square) {
        var gridSquare = this.grid[square.col][square.row];
        if(square.isSelected) {
            gridSquare.style.border = "2px solid #ff9600";
        } else {
            gridSquare.style.border = square.isActive() ? "2px solid black" : "2px solid white";
        }
    };

    this.update = function() {
        for(var col = 0; col < theGrid.length; col++) {
            for (var row = 0; row < theGrid[col].length; row++) {
                var square = theGrid[col][row];
                if(!square) {
                    continue;
                }
                this.changeBorderSelected(square);
                this.changeBackground(square);
                this.updateDisplayNum(square, settings.selectedResourceNum === 0 ? 'nanite' : 'advBot');
            }
        }
        this.updateInfoBox();
    };

    this.updateDisplayNum = function(square, resourceType) {
        var displayNum = document.getElementById('displayNumcol'+square.col+'row'+square.row);
        if(!displayNum) {
            return;
        }
        if(settings.selectShowNoneOrNanitesOrAmount === 0) {
            displayNum.innerHTML = '';
        } else if(settings.selectShowNoneOrNanitesOrAmount === 1) {
            displayNum.innerHTML = intToStringRound(square[resourceType+'s']);
        } else {
            displayNum.innerHTML = intToStringRound(square[resourceType+'Amount']);
        }
    };

    this.changeBackground = function(square) {
        var gridSquare = this.grid[square.col][square.row];
        if(square.isActive()) {
            gridSquare.style.background = colorShiftMath(360, Math.log10(square.nanites));
            gridSquare.style.opacity = 1;
        } else {
            var temp = Math.log10(square.consumeCost)/15+.2;
            gridSquare.style.background = "hsl(120, 88%, 13%)";
            gridSquare.style.opacity = temp > 1 ? 1 : temp;
        }
    };

    this.updateInfoBox = function() {
        if(selected.length === 0) {
            return;
        }
        this.changeBorderColors();
        showNanites();
        selectedActiveOrNot();
        drawDirectionArrow();
        this.drawButtons();
    };

}

function buttonSetup(type, typeUpper, label) { //lol javascript
    var buyAvailableOr = selected[0]["canBuy"+typeUpper+"AfterMultiBuy"]() ? 1 : 0;
    var buyAvailableAnd = selected[0]["canBuy"+typeUpper+"AfterMultiBuy"]();
    var amount = selected[0][type+'Amount'];
    var lastSelected = selected[0];
    for(var i = 1; i < selected.length; i++) {
        if(selected[i][type+'Amount'] !== amount) {
            amount = -1;
        }
        lastSelected = selected[i];
        buyAvailableOr += selected[i]["canBuy"+typeUpper+"AfterMultiBuy"]() ? 1 : 0;
        buyAvailableAnd = buyAvailableAnd && selected[i]["canBuy"+typeUpper+"AfterMultiBuy"]();
    }
    var lowestSelected = selected.length > 1 ? getLowestSquare(getSelectedActive(), type) : selected[0];
    var displaySquare = settings.showLastOrLowest ? lowestSelected : lastSelected;
    if(!displaySquare) {
        return;
    }
    document.getElementById(type+'Amount').innerHTML = displaySquare[type+'Amount'];
    document.getElementById(type+'Cost').innerHTML = "Cost is: " + intToStringRound(displaySquare[type+'CostAfterMultiBuy'](settings.buyPerClick))+", ";
    document.getElementById(type+'Benefit').innerHTML = "Gain: +"+displaySquare[type+'AmountBonus']+" "+label+" per second, ";
    document.getElementById(type+'SpecialNext').innerHTML = "Next Bonus at "+displaySquare[type+'NextSpecial']+".";
    document.getElementById('buy'+typeUpper+'Button').style.borderColor = buyAvailableAnd ? "green" : buyAvailableOr ? "yellow" : "red";
    document.getElementById('numSelected'+typeUpper+'ButtonBuyable').style.color = buyAvailableAnd ? "green" : buyAvailableOr ? "yellow" : "red";
    document.getElementById('numSelected'+typeUpper+'ButtonBuyable').innerHTML = buyAvailableOr + " / " + selected.length;
}

function drawDirectionArrow() {
    var arrows = [document.getElementById('leftArrow'), document.getElementById('rightArrow'), document.getElementById('upArrow'), document.getElementById('downArrow')];
    var dir = selected[0].transferDirection;
    clearArrows(arrows);

    for(var i = 0; i < selected.length; i++) {
        if(selected[i].transferDirection !== dir) {
            return; //just clear arrows if they're not all the same
        }
    }
    var arrowToChange = arrows[0];
    if(dir === "East") {
        arrowToChange = arrows[1];
    } else if(dir === "North") {
        arrowToChange = arrows[2];
    } else if(dir === "South") {
        arrowToChange = arrows[3];
    }
    arrowToChange.style.backgroundColor = "#ff9600";
}

function clearArrows(arrows) {
    for(var x = 0; x < arrows.length; x++) {
        arrows[x].style.backgroundColor = "transparent";
    }
}

function colorShiftMath(initialColor, multi, leftOverMulti) {
    //Hue is 0-360, 0 is red, 120 is green, 240 is blue. Sat is 0-100, 0=greyscale. Light is 0-100, 25=half black
    var hue = initialColor - (multi-1)*30; //- (leftOverMulti)*9;
    var sat = 10+Math.pow(multi, .8) * 2; //+ (leftOverMulti)*3
    sat = sat > 100 ? 100 : sat; //multi^.9 * 6 reaches at 23
    var light = 50;
    return "hsl("+hue+", "+sat+"%, "+light+"%)";
}

function changeBordersOfLowest(viewGrid) {
    if(!settings.selectOneOrMultiple || !settings.selectAllOrLowestBorderColor || selected.length === 0) {
        return;
    }
    var lowestSquares;
    if(settings.selectedResourceNum === 0) {
        lowestSquares = getLowestSquares(getSelectedActive(), 'nanite');
    } else {
        lowestSquares = getLowestSquares(getSelectedActive(), 'advBot');
    }
    for (var i = 0; i < lowestSquares.length; i++) {
        var gridSquare = viewGrid[lowestSquares[i].col][lowestSquares[i].row];
        if(lowestSquares[i].isSelected) {
            gridSquare.style.border = "2px solid blue";
        }
    }
}

function selectedSingleOrMultiple() {
    if(selected.length > 1) { //selected multiple
        document.getElementById('selectedTypeLabel').innerHTML = "Total";
        document.getElementById('infoGridAverage').style.display = 'inline-block';
        document.getElementById('infoGridLowest').style.display = 'inline-block';
    } else {
        document.getElementById('selectedTypeLabel').innerHTML = "Amount";
        document.getElementById('infoGridAverage').style.display = 'none';
        document.getElementById('infoGridLowest').style.display = 'none';
    }
}

function selectedActiveOrNot() {
    var selectedActiveAND = true;
    var selectedActiveOR = false;
    for(var i = 0; i < selected.length; i++) {
        var isActive = selected[i].isActive();
        selectedActiveAND = selectedActiveAND && isActive;
        selectedActiveOR = selectedActiveOR || isActive;
    }
    if(selectedActiveAND) {
        labelChange(true, false);
    } else if(selectedActiveOR) {
        labelChange(true, true);
    } else {
        labelChange(false, true);
    }
    selectedSingleOrMultiple()
}

function labelChange(isShowing, consumeShowing) {
    document.getElementById('totalLabel').style.display = isShowing ? "block" : "none";
    document.getElementById('totalTs').style.display = isShowing ? "block" : "none";
    document.getElementById('averageTs').style.display = isShowing ? "block" : "none";
    document.getElementById('lowestTs').style.display = isShowing || !consumeShowing ? "block" : "none";

    document.getElementById('createdLabel').style.display = isShowing ? "block" : "none";
    document.getElementById('totalTRate').style.display = isShowing ? "block" : "none";
    document.getElementById('averageTRate').style.display = isShowing ? "block" : "none";
    document.getElementById('lowestTRate').style.display = isShowing || !consumeShowing ? "block" : "none";

    document.getElementById('sentLabel').style.display = isShowing ? "block" : "none";
    document.getElementById('totalTTransferAmount').style.display = isShowing ? "block" : "none";
    document.getElementById('averageTTransferAmount').style.display = isShowing ? "block" : "none";
    document.getElementById('lowestTTransferAmount').style.display = isShowing || !consumeShowing ? "block" : "none";

    document.getElementById('transferRateLabel').style.display = isShowing ? "block" : "none";
    document.getElementById('totalTransferRate').style.display = isShowing ? "block" : "none";
    document.getElementById('averageTransferRate').style.display = isShowing ? "block" : "none";
    document.getElementById('lowestTransferRate').style.display = isShowing || !consumeShowing ? "block" : "none";

    document.getElementById('consumeCostLabel').style.display = consumeShowing ? "block" : "none";
    document.getElementById('totalConsumeCost').style.display = consumeShowing ? "block" : "none";
    document.getElementById('averageConsumeCost').style.display = consumeShowing ? "block" : "none";
    document.getElementById('lowestConsumeCost').style.display = consumeShowing ? "block" : "none";
}

function showNanites() {
    if(settings.selectedResourceNum === 0) {
        updateInfoGrid('Nanites', 'nanite');
    } else if(settings.selectedResourceNum === 1) {
        updateInfoGrid('Advanced Robots', 'advBot');
    }

    updateInfoGridExtras();
}

function updateInfoGridExtras() {
    var totalTransferRate = 0;
    for(var i = 0; i < selected.length; i++) {
        totalTransferRate += (selected[i].transferRate/100);
    }
    var inactiveList = getSelectedInactive();
    var totalConsumeCost = 0;
    for(i = 0; i < inactiveList.length; i++) {
        totalConsumeCost += inactiveList[i].consumeCost;
    }
    var lowestInactive = getLowestInactiveSquare(inactiveList);

    document.getElementById('totalTransferRate').innerHTML = intToString(totalTransferRate);
    document.getElementById('averageTransferRate').innerHTML = intToString(totalTransferRate / selected.length);

    document.getElementById('totalConsumeCost').innerHTML = intToString(totalConsumeCost);
    document.getElementById('averageConsumeCost').innerHTML = intToString(totalConsumeCost / inactiveList.length);
    if(lowestInactive) {
        document.getElementById('lowestConsumeCost').innerHTML = intToString(lowestInactive.consumeCost);
    }
}

function updateInfoGrid(label, varLabel) {
    var totalNanites = 0;
    var totalNaniteRate = 0;
    var totalNaniteTransferAmount = 0;
    var totalNaniteAmountReceived = 0;
    var totalConsumeCost = 0;
    for(var i = 0; i < selected.length; i++) {
        totalNanites += selected[i][varLabel+'s'];
        totalNaniteRate += selected[i][varLabel+'Rate'];
        totalNaniteTransferAmount += selected[i][varLabel+'TransferAmount'];
        totalNaniteAmountReceived += selected[i][varLabel+'AmountReceived'];
        totalConsumeCost += selected[i].consumeCost;
    }
    document.getElementById('resourceTypeLabel').innerHTML = label;
    document.getElementById('totalTs').innerHTML = intToString(totalNanites);
    document.getElementById('totalTRate').innerHTML = intToString(totalNaniteRate);
    document.getElementById('totalTTransferAmount').innerHTML = intToString(totalNaniteTransferAmount);
    document.getElementById('totalTAmountReceived').innerHTML = intToString(totalNaniteAmountReceived);
    document.getElementById('netTs').innerHTML = intToStringNegative(totalNaniteRate + totalNaniteAmountReceived - totalNaniteTransferAmount );

    if(selected.length > 1) {
        document.getElementById('averageTs').innerHTML = intToString(totalNanites / selected.length);
        document.getElementById('averageTRate').innerHTML = intToString(totalNaniteRate / selected.length);
        document.getElementById('averageTTransferAmount').innerHTML = intToString(totalNaniteTransferAmount / selected.length);
        document.getElementById('averageTAmountReceived').innerHTML = intToString(totalNaniteAmountReceived / selected.length);

        var lowestSquare = getLowestSquare(getSelectedActive(), varLabel);
        if(lowestSquare) {
            document.getElementById('lowestTs').innerHTML = intToString(lowestSquare[varLabel + 's']);
            document.getElementById('lowestNetTs').innerHTML = intToStringNegative(lowestSquare[varLabel + 'Rate'] + lowestSquare[varLabel + 'AmountReceived'] - lowestSquare[varLabel + 'TransferAmount']);
            document.getElementById('lowestTRate').innerHTML = intToString(lowestSquare[varLabel + 'Rate']);
            document.getElementById('lowestTAmountReceived').innerHTML = intToString(lowestSquare[varLabel + 'AmountReceived']);
            document.getElementById('lowestTTransferAmount').innerHTML = intToString(lowestSquare[varLabel + 'TransferAmount']);
            document.getElementById('lowestTransferRate').innerHTML = intToString(lowestSquare.transferRate / 100);
            document.getElementById('lowestConsumeCost').innerHtml = intToString(lowestSquare.consumeCost);
        }
        var selectedInactive = getSelectedInactive();
        if(selectedInactive.length === selected.length) { //only selecting inactive
            var lowestInactive = getLowestInactiveSquare(selectedInactive);
            document.getElementById('lowestNetTs').innerHTML = intToStringNegative(lowestInactive[varLabel + 'Rate'] + lowestInactive[varLabel + 'AmountReceived'] - lowestInactive[varLabel + 'TransferAmount']);
            document.getElementById('lowestTAmountReceived').innerHTML = intToString(lowestInactive[varLabel + 'AmountReceived']);
            document.getElementById('lowestConsumeCost').innerHtml = intToString(lowestInactive.consumeCost);
        }

    }

}

function showOrHideBox() {
    if(selected.length === 0) {
        document.getElementById('infoPanel').style.display = "none";
        return true;
    }
    document.getElementById('infoPanel').style.display = "block";
}
