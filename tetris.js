/****************************
 *        tetris.js         *
 *  Written by Gilad Artzi  *
 *       August 2011        *
 ****************************/

var Tetris = function(holder, prevHolder, linesHolder, w, h, blockSize) {
    var _holder = document.getElementById(holder);
    var _board = new Board(_holder, w, h, blockSize), _nextPiece = false,
        _pHolder = document.getElementById(prevHolder),
        _currPiece, _this = this, cnt = 1, _pieces = new Array(), _paused,
        pf = new PieceFactory(), _previewWidth = 5, _previewHeight = 6,
        _preview = new Preview(_pHolder, _previewWidth, _previewHeight, blockSize),
        _lHolder = document.getElementById(linesHolder), _started = false;
    var _newPiece = function() {
        if (!_nextPiece) _nextPiece = pf.getRandomPeice();
        _currPiece = new Piece(_this, _board, cnt++, 4, 0, _nextPiece);
        _pieces.push(_currPiece);
        _nextPiece = pf.getRandomPeice();
        _preview.draw(_nextPiece, _nextPiece.prevOffX(), _nextPiece.prevOffY());
    };
    var _finishSignal = function() {
        var n = _board.fullLines();
        while (!isNaN(n)) {
            _board.clearLine(n);
            _board.updateVisualGrid(_pieces);
            n = _board.fullLines();
        }
        if (!_board.topLineFull()) _newPiece();
    };
    var _blinkOff = function(lines) {
        for (var i = 0; i < lines.length; i++) {
            _board.hideLine(lines[i]);
        }
    };
    var _blinkOn = function(lines) {
        for (var i = 0; i < lines.length; i++) {
            _board.restoreLine(lines[i], _pieces);
        }
    };
    var _blink = function(lines, times, delay, callback) {
        if (times <= 0 && callback) callback();
        else {
            if (times % 2 == 0) _blinkOff(lines);
            else _blinkOn(lines);
            setTimeout(function() { _blink(lines, times-1, delay, callback) }, delay);
        }
    }
    this.finishSignal = function() {
        var lines = _board.getFullLines(), tmp = parseInt(_lHolder.innerHTML);
        if (lines.length > 0) {
            _lHolder.innerHTML = tmp + lines.length;
            _blink(lines, 6, 150, _finishSignal);
        }
        else {
            _finishSignal();
        }
    };
    this.start = function() {
        if (_started) { // restart
            _lHolder.innerHTML = 0;
            _board.destruct();
            _currPiece.destruct();
            _pieces = new Array()
            _board = new Board(_holder, w, h, blockSize);
        }
        _pieces.push('padding');
        _started = true;
        _paused = false;
        _newPiece();
    };
    this.pause = function() {
        if (_currPiece.isActive()) {
            if (_paused) _currPiece.resume();
            else _currPiece.pause();
            _paused = !_paused;
        }
    };
    var _rotateSignal = function() { if (_currPiece.isActive() && !_paused) _currPiece.rotate(); };
    var _leftSignal = function() { if (_currPiece.isActive() && !_paused) _currPiece.left(); };
    var _rightSignal = function() { if (_currPiece.isActive() && !_paused) _currPiece.right(); };
    var _downSignal = function() { if (_currPiece.isActive() && !_paused) _currPiece.down(); };
    var init = (function() {
        document.onkeydown = function(e) {
            if (e.keyCode == 37) _leftSignal();
            if (e.keyCode == 38) _rotateSignal();
            if (e.keyCode == 39) _rightSignal();
            if (e.keyCode == 40) _downSignal();
        }
    })();
};
var Preview = function(holder, w, h, blockSize) {
    var _holder = holder, _width = w, _height = h, _grid = new Array(h),
        _blockSize = blockSize, _preview, _this = this;
    var _drawPreview = function() {
        _preview = document.createElement('canvas');
        _preview.setAttribute('id', '_preview');
        _preview.setAttribute('width', _width * blockSize);
        _preview.setAttribute('height', _height * blockSize);
        _preview.setAttribute('style', "border: 1px black solid;");
        _holder.appendChild(_preview);
        _context = _preview.getContext("2d");
    };
    var init = (function() {
        _drawPreview();
        for (var y = 0; y < _height; y++) {
            _grid[y] = new Array(_width);
            for (var x = 0; x < _width; x++) {
                _grid[y][x] = { 'occ' : 0, 'x' : x * _blockSize,
                    'y' : y * _blockSize };
            }
        }
    })();
    this.getContext = function() { return _context; };
    this.getxCoor = function(x) { return _grid[0][x].x; };
    this.getyCoor = function(y) { return _grid[y][0].y; };
    this.getBlockSize = function() { return _blockSize; };
    this.occupy = function() { return true; };	/* dummy :-( */
    this.isAvail = function() { return true; }; /* dummy :-( */
    this.draw = function(lp, x, y) {
        _context.clearRect(0, 0, _width * blockSize, _height * blockSize);
        var _sq = lp.data(), _color = lp.getColor();
        for (var i = 0; i < _sq.length; i++) {
            var toDraw = new Square(_this, 0, x + _sq[i].x, y + _sq[i].y, _color);
            toDraw.draw();
        }
    };
};
var Board = function(holder, w, h, blockSize) {
    var _holder = holder, _width = w, _height = h,
        _board, _context, _grid = new Array(_height),
        _blockSize = blockSize, _this = this;
    var _drawBoard = function() {
        _board = document.createElement('canvas');
        _board.setAttribute('id', '_tetris');
        _board.setAttribute('width', _width * blockSize);
        _board.setAttribute('height', _height * blockSize);
        _board.setAttribute('style', "border: 1px black solid;");
        _holder.appendChild(_board);
        _context = _board.getContext("2d");
    };
    var _initGrid = function() {
        for (var y = 0; y < _height; y++) {
            _grid[y] = new Array(_width);
            for (var x = 0; x < _width; x++) {
                _grid[y][x] = { 'occ' : 0, 'x' : x * _blockSize,
                    'y' : y * _blockSize };
            }
        }
    };
    this.init = (function() { _drawBoard(); _initGrid(); })();
    this.occupy = function(x, y, id) { _grid[y][x].occ = id; };
    this.unoccupy = function(x, y) { _grid[y][x].occ = 0; };
    this.isOccupied = function(x, y, id) {
        if (!_grid[y][x].occ) return false;
        return _grid[y][x].occ != id;
    };
    this.getxCoor = function(x) { return _grid[0][x].x; };
    this.getyCoor = function(y) { return _grid[y][0].y; };
    this.getBlockSize = function() { return _blockSize; };
    this.getContext = function() { return _context; };
    this.destruct = function() { _holder.removeChild(_board); };
    this.isAvail = function(x, y, id) {
        if (x < 0 || x >= _width) return false;
        else if (y < 0 || y >= _height) return false;
        else return !this.isOccupied(x, y, id);
    }
    this.printGrid = function() {
        var str = "";
        for (var i = 0; i < _grid.length; i++) {
            var tmpStr = "";
            for (var j = 0; j < _grid[i].length; j++) {
                str += _grid[i][j].occ + ' ';
            }
            str += tmpStr + '\n';
        }
        return str;
    };
    this.topLineFull = function() {
        for (var i = 0; i < _grid[0].length; i++) {
            if (_grid[0][i].occ) return true;
        }
        return false;
    };
    this.fullLines = function() {
        for (var i = _grid.length - 1; i >= 0; i--) {
            goodLine = true;
            for (var j = 0; j < _grid[i].length && goodLine; j++) {
                if (!_grid[i][j].occ) goodLine = false;
            }
            if (goodLine) { return i; }
        }
        return 'none';
    };
    this.getFullLines = function() {
        var ans = Array();
        for (var i = _grid.length - 1; i >= 0; i--) {
            toAdd = true;
            for (var j = 0; j < _grid[i].length && toAdd; j++) {
                if (!_grid[i][j].occ) toAdd = false;
            }
            if (toAdd) { ans.push(i); }
        }
        return ans;
    };
    this.clearLine = function(n) {
        for (var i = n; i > 0; i--) {
            for (var j = 0; j < _grid[i].length; j++) {
                _grid[i][j].occ = _grid[i-1][j].occ;
            }
        }
        for (var i = 0; i < _grid[0].length; i++) {
            _grid[0][i].occ = 0;
        }

    };
    var _draw = function(x, y, color) {
        _context.fillStyle = color;
        _context.fillRect(x, y, _blockSize, _blockSize);
    };
    var _clearBoard = function(pieces) {
        for (var i = 1; i < pieces.length; i++) {
            pieces[i].destroy();
        }
    };
    this.hideLine = function(line) {
        for (var i = 0; i < _grid[line].length; i++) {
            _context.clearRect(_grid[line][i].x, _grid[line][i].y, _blockSize, _blockSize);
        }
    };
    this.restoreLine = function(line, pieces) {
        for (var i = 0; i < _grid[line].length; i++) {
            if (_grid[line][i].occ) {
                _context.fillStyle = pieces[_grid[line][i].occ].getColor();
                _context.fillRect(_grid[line][i].x, _grid[line][i].y, _blockSize, _blockSize);
            }
        }
    };
    this.updateVisualGrid = function(pieces) {
        _clearBoard(pieces);
        for (var i = _grid.length - 1; i >= 0; i--) {
            for (var j = 0; j < _grid[i].length; j++) {
                if (_grid[i][j].occ) {
                    _draw(_grid[i][j].x, _grid[i][j].y, pieces[_grid[i][j].occ].getColor());
                }
            }
        }
    };
}

var Square = function(board, pieceId, x, y, color) {
    var _board = board,
        _x = x,
        _y = y,
        _context = _board.getContext(),
        _pieceId = pieceId,
        _color = color;
    var _draw = function() {
        if (_board.isAvail(_x, _y, _pieceId)) {
            _context.fillStyle = _color;
            _context.fillRect(	_board.getxCoor(_x), _board.getyCoor(_y),
                _board.getBlockSize(), _board.getBlockSize() );
            _board.occupy(_x, _y, _pieceId);
        }

    };
    var _move = function(x, y) {
        _x = x;
        _y = y;
        _draw();
    };
    this.clear = function(x, y) {
        if (_board.isAvail(x, y, _pieceId)) {
            _context.clearRect(	_board.getxCoor(x), _board.getyCoor(y),
                _board.getBlockSize(), _board.getBlockSize() );
            _board.unoccupy(x, y);
        }
    };
    this.destroy = function(x, y) {
        if (_board.isAvail(x, y, _pieceId)) {
            _context.clearRect(	_board.getxCoor(x), _board.getyCoor(y),
                _board.getBlockSize(), _board.getBlockSize() );
        }
    };
    this.moveRelative = function(x, y) {
        _move( _x + x, _y + y );
    };
    this.draw = function(x, y) {
        !isNaN(x) && !isNaN(y) ? _move(x, y) : _draw();
        return this;
    };
    this.getx = function() { return _x; };
    this.gety = function() { return _y; };
}
var Coordinate = function(x, y) {
    return { 'x' : x, 'y' : y };
}
var LogicPiece = function(states, color) {
    var _squares = new Array(), _movements = new Array(states);
    var _states = states, _color = color, _prevOffX, _prevOffY;
    this.addSquare = function(rx, ry) {
        _squares.push(new Coordinate(rx, ry)); return this;
    };
    this.addMovement = function(i, coor) {
        if (coor.length == 8) {
            for (var j = 0; j < coor.length; j += 2) {
                _movements[i-1].push(new Coordinate(coor[j], coor[j+1]));
            }
        }
        return this;
    };
    this.setPrevOffX = function(x) { _prevOffX = x; return this; };
    this.setPrevOffY = function(y) { _prevOffY = y; return this; };
    this.prevOffX = function() { return _prevOffX; };
    this.prevOffY = function() { return _prevOffY; };
    this.data = function() { return _squares; };
    this.movement = function(i) { return _movements[i]; };
    this.getStates = function() { return _states; };
    this.getColor = function() { return _color; };
    var _init = (function() {
        for (var i = 0; i < _movements.length; i++) {
            _movements[i] = new Array();
        }
    })();
};
var PieceFactory = function() {
    var _pieces = new Array();
    var _init = (function() {
        var i = new LogicPiece(2, 'maroon');
        i.addSquare(1, 0).addSquare(1, 1)
            .addSquare(1, 2).addSquare(1, 3)
            .setPrevOffX(1).setPrevOffY(1)
            .addMovement(1, [-2, 2, -1, 1, 0, 0, 1, -1])
            .addMovement(2, [2, -2, 1, -1, 0, 0, -1, 1]);
        var j = new LogicPiece(4, 'blue');
        j.addSquare(0, 0).addSquare(0, 1)
            .addSquare(1, 1).addSquare(2, 1)
            .setPrevOffX(1).setPrevOffY(2)
            .addMovement(1, [0, 2, 1, 1, 0, 0, -1, -1])
            .addMovement(2, [2, 0, 1, -1, 0, 0, -1, 1])
            .addMovement(3, [0, -2, -1, -1, 0, 0, 1, 1])
            .addMovement(4, [-2, 0, -1, 1, 0, 0, 1, -1]);
        var l = new LogicPiece(4, 'orange');
        l.addSquare(0, 0).addSquare(0, 1)
            .addSquare(-1, 1).addSquare(-2, 1)
            .setPrevOffX(3).setPrevOffY(2)
            .addMovement(1, [-2, 0, -1, -1, 0, 0, 1, 1])
            .addMovement(2, [0, 2, -1, 1, 0, 0, 1, -1])
            .addMovement(3, [2, 0, 1, 1, 0, 0, -1, -1])
            .addMovement(4, [0, -2, 1, -1, 0, 0, -1, 1]);
        var o = new LogicPiece(0, 'navy');
        o.addSquare(0, 0).addSquare(1, 0)
            .addSquare(0, 1).addSquare(1, 1)
            .setPrevOffX(1).setPrevOffY(2);
        var s = new LogicPiece(2, 'green');
        s.addSquare(0, 0).addSquare(-1, 0)
            .addSquare(-1, 1).addSquare(-2, 1)
            .setPrevOffX(3).setPrevOffY(2)
            .addMovement(1, [-2, 0, -1, 1, 0, 0, 1, 1])
            .addMovement(2, [2, 0, 1, -1, 0, 0, -1, -1]);
        var t = new LogicPiece(4, 'brown');
        t.addSquare(1, 0).addSquare(0, 1)
            .addSquare(1, 1).addSquare(2, 1)
            .setPrevOffX(1).setPrevOffY(2)
            .addMovement(1, [-1, 1, 1, 1, 0, 0, -1, -1])
            .addMovement(2, [1, 1, 1, -1, 0, 0, -1, 1])
            .addMovement(3, [1, -1, -1, -1, 0, 0, 1, 1])
            .addMovement(4, [-1, -1, -1, 1, 0, 0, 1, -1]);
        var z = new LogicPiece(2, 'red');
        z.addSquare(0, 0).addSquare(1, 0)
            .addSquare(1, 1).addSquare(2, 1)
            .setPrevOffX(1).setPrevOffY(2)
            .addMovement(1, [2, 0, 1, 1, 0, 0, -1, 1])
            .addMovement(2, [-2, 0, -1, -1, 0, 0, 1, -1]);
        _pieces.push(i);
        _pieces.push(j);
        _pieces.push(l);
        _pieces.push(o);
        _pieces.push(s);
        _pieces.push(t);
        _pieces.push(z);
    })();
    this.piece = function() { return _pieces[0]; };
    this.getRandomPeice = function() {
        var r = Math.floor(Math.random() * _pieces.length);
        return _pieces[r];
    };
};
var Piece = function(tetris, board, sn, x, y, p) {
    var _x = x, _y = y, _board = board,
        _active = true,	_squares = new Array(), _context = _board.getContext(),
        _p = p,	_state = 0, _interval, _tetris = tetris,
        _sn = sn, _color = p.getColor(), _states = p.getStates();

    var _clear = function() {
        for (var i = 0; i < _squares.length; i++) {
            _squares[i].clear(_squares[i].getx(), _squares[i].gety());
        }
    };
    this.destroy = function() {
        for (var i = 0; i < _squares.length; i++) {
            _squares[i].destroy(_squares[i].getx(), _squares[i].gety());
        }
    };
    var _move = function(xdir, ydir) {
        _clear();
        for (var i = 0; i < _squares.length; i++) {
            _squares[i].draw(_squares[i].getx() + xdir, _squares[i].gety() + ydir);
        }
    };
    var _possibleMove = function(x, y) {
        for (var i = 0; i < _squares.length; i++) {
            if (!_board.isAvail(_squares[i].getx() + x, _squares[i].gety() + y, _sn)) return false;
        }
        return true;
    };
    var _possibleRotate = function(c) {
        for (var i = 0; i < _squares.length; i++) {
            if (!_board.isAvail(_squares[i].getx() + c[i].x, _squares[i].gety() + c[i].y, _sn)) return false;
        }
        return true;
    };
    var _finish = function() { clearInterval(_interval); _active = false; _tetris.finishSignal() };
    this.down = function() { if (_possibleMove(0, 1)) _move(0, 1); else _finish(); };
    var _fall = this.down; // closure issues
    this.left = function() { if (_possibleMove(-1, 0)) _move(-1, 0) };
    this.right = function() { if (_possibleMove(1, 0)) _move(1, 0) };
    this.forceDown = function(n) {
        for (var i = 0; i < _squares.length; i++) {
            if (_squares[i].gety() < n) {
                _squares[i].clear(_squares[i].getx(), _squares[i].gety());
                _squares[i].draw(_squares[i].getx(), _squares[i].gety() + 1);
            }
            else if (_squares[i].gety() == n) {
                _squares[i].clear(_squares[i].getx(), _squares[i].gety());
            }
        }
    };

    this.rotate = function() {
        if (_states > 0) {
            var newCoor = p.movement(_state);
            if (_possibleRotate(newCoor)) {
                _clear();
                for (var i = 0; i < _squares.length; i++) {
                    _squares[i].moveRelative(newCoor[i].x, newCoor[i].y);
                }
                _state = (_state + 1) % _states;
            }
        }
    };
    this.pause = function() { clearInterval(_interval); };
    this.destruct = function() { clearInterval(_interval); };
    this.resume = function() { _interval = setInterval(_fall, 500); };
    this.getColor = function() { return _color; };
    this.isActive = function() { return _active; };
    this.init = (function() {
        var _sq = _p.data();
        for (var i = 0; i < _sq.length; i++) {
            var toPush = new Square(_board, _sn, _x + _sq[i].x, _y + _sq[i].y, _color);
            _squares.push(toPush.draw());
        }
        _interval = setInterval(_fall, 500);
    })();
}