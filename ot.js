module.exports = {


	getLoc: function(loc){
		if (loc === undefined){
			return null;
		}
		var num = parseInt(loc)
		if (num === NaN) {
			return null;
		}
		return num;
	},


	applyInsert: function(ins){

		var loc = this.getLoc(ins.loc);// now an int.
		if (loc === undefined || loc === null) {
			console.log("loc undefined");
			return "";
		}
		if (loc > this.collabDoc.length + 1) {
			console.log("loc too far BIG"); // NEED TO ADDRESS THIS CASE?
			return "";
		}
		var toInsert = ins.content;
		if (toInsert === undefined || toInsert === null){
			console.log("no content")
			return "";
		}
		if (this.collabDoc.length === 0) {
			return toInsert;
		}

		return [this.collabDoc.slice(0, loc), toInsert, this.collabDoc.slice(loc, this.collabDoc.length - 1)].join("");

	},


	applyOp: function(op){
		if (op === undefined || this.collabDoc === undefined || op.type === undefined){
			console.log("op undefined");
			this.collabDoc = "";
		}
		if (op.type == "Insert"){
			this.collabDoc = this.applyInsert(op);
		}
		
		return this.collabDoc;

	},

	collabDoc: "",

	hashString: function(str) {
		console.log("Str is", str)
		var acc = 1
		for (var i = 0; i < str.length; i++){
			console.log(str.charCodeAt(i))
			acc = (str.charCodeAt(i)*(i+1)) + acc
		}
		return acc;// % 1299827;
	}

}