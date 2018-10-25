function InputTextBoxes()
{
	var N;
	var E;
	var key_size;
    var mbuffer;
    var T;
    var mfilter_per_entry;
		var mfence_pointer_per_entry;
		var hash_table_gc_threshold;
    var P;
    var leveltier;  // tiered is 0, leveled is 1, lazy_level is 2, fluid_LSM-Tree is 3
    var isLeveled;
		var isOptimalFPR; // 0 -> false; 1 -> true
		var fluidK;
		var fluidZ;
		var Mu;
		var s;
		var Y;
		var w;
		var r;
		var v;
		var qL;
		var qS;
		var LLBushT;
		var LLBushK;
		var X; //updated entries in LL-Bush
}


function parseInputTextBoxes(prefix="lsm_bush")
{
	var parsedBoxes = new InputTextBoxes();

	//Dataset and Environment
    parsedBoxes.N = parseInt(document.getElementById("N").value.replace(/\D/g,''),10);
    parsedBoxes.E = parseInt(document.getElementById("E").value.replace(/\D/g,''),10);
		parsedBoxes.key_size = parseFloat(document.getElementById("Key-Size").value);
    parsedBoxes.P = parseInt(document.getElementById("P").value.replace(/\D/g,''), 10);
		parsedBoxes.Mu = 1;
		parsedBoxes.read_latency = parseFloat(document.getElementById("read-latency").value);
		parsedBoxes.write_latency = parseFloat(document.getElementById("write-latency").value);


		//Workload
		parsedBoxes.s = parseInt(document.getElementById("s").value.replace(/\D/g,''), 10);
		parsedBoxes.w = parseFloat(document.getElementById("w").value);
		parsedBoxes.r = parseFloat(document.getElementById("r").value);
		parsedBoxes.v = parseFloat(document.getElementById("v").value);
		parsedBoxes.qL = parseFloat(document.getElementById("qL").value);

		// Configuration for an architecture
		parsedBoxes.L = parseInt(document.getElementById(prefix+"_L").value.replace(/\D/g,''), 10);
		parsedBoxes.mbuffer = parseFloat(document.getElementById(prefix+"_mbuffer").value.replace(/\D/g,''))*1048576;
    parsedBoxes.T = parseFloat(document.getElementById(prefix+"_T").value);
    parsedBoxes.mfilter_per_entry = parseFloat(document.getElementById(prefix+"_mfilter_per_entry").value);
		parsedBoxes.mfence_pointer_per_entry = parseFloat(document.getElementById(prefix+"_mfence_pointer_per_entry").value);
		parsedBoxes.hash_table_gc_threshold = parseFloat(document.getElementById("lsh_table_gc_threshold").value);
    parsedBoxes.leveltier = getRadioValueByName(prefix+"_type");
		parsedBoxes.isOptimalFPR = true;
		if(prefix == "lsm_tree"){
			parsedBoxes.isOptimalFPR = getRadioValueByName("fpr_radio"); // 0 -> fixed; 1 -> optimal for non-result point lookup ; 2 -> optimal for point lookup
		}



		if(parsedBoxes.leveltier == 3){
			parsedBoxes.fluidK = parseInt(document.getElementById("Fluid LSM-Tree K").value.replace(/\D/g,''), 10);
			parsedBoxes.fluidZ = parseInt(document.getElementById("Fluid LSM-Tree Z").value.replace(/\D/g,''), 10);
		}else if(parsedBoxes.leveltier == 0){
			parsedBoxes.fluidK = Math.floor(parsedBoxes.T) - 1;
			parsedBoxes.fluidZ = Math.floor(parsedBoxes.T) - 1;
		}else if(parsedBoxes.leveltier == 1){
			parsedBoxes.fluidK = 1;
			parsedBoxes.fluidZ = 1;
		}else if(parsedBoxes.leveltier == 2){
			parsedBoxes.fluidK = Math.floor(parsedBoxes.T) - 1;
			parsedBoxes.fluidZ = 1;
		}else{
			parsedBoxes.fluidK = 1;
			parsedBoxes.fluidZ = 1;
			parsedBoxes.T = parseFloat(document.getElementById("lsm_bush_T").value);
			parsedBoxes.lsm_bush_K = parseInt(document.getElementById("lsm_bush_K").value.replace(/\D/g,''), 10);
			//parsedBoxes.X = parseInt(document.getElementById("X").value.replace(/\D/g,''), 10);
		}


    return parsedBoxes;
}

function Filter() {
    var nokeys;
    var fp;
    var mem;
}

function getTotalNonExistingPointLookupCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	var total = 0;
	for(j = 1; j <= L; j++){
		total += getLeveledNonExistingPointLookupCost(j, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	}

	return total;

}

function getTotalExistingPointLookupCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	var total = 0;
	for(j = 1; j <= L; j++){
		total += getLeveledExistingPointLookupCost(j, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	}

	return total;
}

function getTotalShortRangeLookupCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	var total = 0;
	for(j = 1; j <= L; j++){
		total += getLeveledShortRangeLookupCost(j, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	}

	return Math.ceil(total);
}

function getTotalLongRangeLookupCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	var total = 0;
	for(j = 1; j <= L; j++){
		total += getLeveledLongRangeLookupCost(j, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	}
	return Math.ceil(total);
}

function getTotalUpdateCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	var total = 0;
	for(j = 1; j <= L; j++){
		total += getLeveledUpdateCost(j, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	}
	return total;

}

function getTotalSpaceAmp(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	var total = 0;
	for(j = 1; j <= L; j++){
		total += getLeveledSpaceAmp(j, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	}
	return total;
}

function getTotalMemory(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	var total = 0;
	for(j = 1; j <= L; j++){
		total += getLeveledMemory(j, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	}
	return total;
}

function getLeveledLevel(i, initCapacity, L, filter_array, N, T, B,Y,  K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	return i;
}

function getLeveledNonExistingPointLookupCost(i, initCapacity, L, filter_array, N, T, B,Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	var result;
	result = calc_R(filter_array[i - 1]);
	if(leveltier >= 4){
		K = Math.floor(Math.pow(LLBushT, Math.pow(2, L - i - 1)));
		Z = 1;
	}
	if(i < L-Y){
		result *= K;
	}else if(i == L - Y){
		result *= Z;
	}else{
		result = Z;
	}
	return result;
}


function getLeveledExistingPointLookupCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	if(leveltier >= 4){
		K = Math.floor(Math.pow(LLBushT, Math.pow(2, L - i - 1)));
		Z = 1;
	}

	var EULER = 2.71828182845904523536;
	var result;
	result = calc_R(filter_array[i - 1]);
	if(i < L-Y){
		result *= K;
	}else if(i < L){
		result *= Z;
	}else{
		result *= Math.floor(Z/2);
		result += 1;
	}
	return result;
}

function getLeveledShortRangeLookupCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	if(leveltier >= 4){
		K = Math.floor(Math.pow(LLBushT, Math.pow(2, L - i - 1)));
		Z = 1;
	}
		if(filter_array[i-1].nokeys == 0){
			return 0;
		}
			var capacity = initCapacity;
			var runs;
			if(i < L){
				runs = K;
			}else{
				runs = Z;
			}
			if(leveltier >= 4){
				for(j=1;j<=i;j++){
					capacity *= Math.pow(LLBushT, Math.pow(2, L - j - 1));
				}
			}else{
				capacity = capacity*Math.pow(T, i);
			}

			return Math.min(Math.ceil(filter_array[i-1].nokeys/(capacity/runs)), runs);

}

function getLeveledLongRangeLookupCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	var final_result = 0;
	if(leveltier < 4){
		if(i == L){
			final_result = Math.floor(Z*s/B/Mu);
		}else{
			final_result = Math.floor(s/B/Math.pow(T, L - i)/Mu);
		}
	}else{
		if(filter_array[i-1].nokeys == 0){
			final_result = 0;
		}
		if(i == L){
			final_result = Math.floor(s/B/Mu);
		}else{
			var result = s/B/Mu/LLBushK;
			for(var j=L-2;j >= i;j--){
				result /= Math.pow(LLBushT, Math.pow(2, L - j - 1));
			}
			final_result = Math.floor(result);
		}
	}
	return final_result + getLeveledShortRangeLookupCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
}

function getLeveledUpdateCost(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	if(leveltier < 4){
		if(i >= L-Y){
			return (T - 1)/(B*(Z + 1)*Mu);
		}else{
			return (T - 1)/(B*(K + 1)*Mu);
		}
	}else{
		if(i >= L-Y){
			return LLBushK/(B*Mu);
		}else{
			return 1/(B*Mu)
		}
	}

}

function getLeveledSpaceAmp(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	if(leveltier < 4){
		if(i == L){
			return Z-1;
		}else{
			return Math.pow(T, i - L);
		}
	}else{
		if(i == L){
			return 0;
		}else if(i == L - 1){
			return 1/LLBushK;
		}else{
			return 1/LLBushK/Math.pow(LLBushT, Math.pow(2, L - i- 2));
		}
	}

}

function getLeveledMemory(i, initCapacity, L, filter_array, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry){
	return filter_array[i-1].mem+filter_array[i-1].nokeys*key_size*mfence_pointer_per_entry/8;
}

function removeAllChildren(div){
	while (div.firstChild) {
		div.removeChild(div.firstChild);
	}
}

function myCeil(n, i){
	var n_tmp = n;
	var j = 0;
	while(n_tmp < 1){
		n_tmp *= 10;
		j += 1;
	}
	n_tmp *= Math.pow(10, i);
	n_tmp = Math.ceil(n_tmp);
	n_tmp /= Math.pow(10, i+j);
	return n_tmp;
}

function myFloor(n, i){
	var n_tmp = n;
	var j = 0;
	while(n_tmp < 1){
		n_tmp *= 10;
		j += 1;
	}
	n_tmp *= Math.pow(10, i);
	n_tmp = Math.floor(n_tmp);
	n_tmp /= Math.pow(10, i+j);
	return n_tmp;
}

var log10 = Math.log(10);
var lastTreeType = 0;
function getSignificantDigitCount(n) {
    n = Math.abs(String(n).replace(".", "")); //remove decimal and make positive
    if (n == 0) return 0;
    while (n != 0 && n % 10 == 0) n /= 10; //kill the 0s at the end of n

    return Math.floor(Math.log(n) / log10) + 1; //get number of digits
}

function getMostSignificantDigit(d)
{
	var i=0;
	if (d>1 || d<=0)
		return -1;
	else
	{
		while (d<1)
		{
			d=d*10;
			i++;
		}
		return i;
	}
}

function formatBytes(bytes,decimals) {
   if(bytes == 0) return '0 Byte';
	 if(bytes < 1) return (bytes*8).toFixed(4) + ' ' + 'bits';
   var k = 1024; // or 1024 for binary
   var dm = decimals + 1 || 3;
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB', '(*1024) YB'];
   var i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function getRadioValueByName(radioName)
{
    var radios = document.getElementsByName(radioName);
    var val;
    for(var i = 0; i < radios.length; i++){
        if(radios[i].checked){
            val = radios[i].value;
        }
    }
    return parseInt(val);
}

function myLog(x, base)
{
    return Math.log(x) / Math.log(base);
}


function calcBits(filter) {
    var denom=Math.pow(Math.log(2),2);
    return filter.fp == 0 ? 0 : ( - filter.nokeys * Math.log(filter.fp) ) / denom;
}


function calcTotalMemBits(filtersArray) {
    var total = 0;
    for (var i = 0; i < filtersArray.length ; i++) {
        // printf("%d   %d  %f \n", i,  rates[i].size, rates[i].false_positive_rate);
        var val = calcBits(filtersArray[i]);

        total += val;
    }
    return total;
}

function getRmax(lt,N,E,B,T)
{
    var R;
    if (lt==0)
        R=Math.ceil(myLog(N*E/B,T));
    else if (lt==1)
        R=(T-1)*Math.ceil(myLog(N*E/B,T));
    return R;
}




function calc_R(f)
{
    var denom = Math.pow(Math.log(2), 2);
		if(f.mem == undefined || isNaN(f.mem)){
			return 1;
		}
		if(f.nokeys != 0){
			return Math.exp(-(f.mem / f.nokeys) * denom);
		}else{
			return 0;
		}
}

function calc_Y(b, K, Z, T, L){
	var flag = true;
	bb_tmp = Math.log(K)-Math.log(Z)+Math.log(T)/(T-1)
	bb_A = b*Math.pow(Math.log(2),2)*(Math.pow(T, L+1)-1) + bb_tmp*T
	bb_C = T*Math.log(T)
	bb_B = bb_tmp+Math.log(T)
	var Y = 0;
	if(flag){

		delta = Number.MAX_VALUE;
		for(var i=0;i<L;i++){
			bb_X = L - i;
			tmp_delta = bb_A - (bb_B*Math.pow(T, bb_X) - bb_C*bb_X)
			if(tmp_delta > 0 && tmp_delta < delta){
				delta = tmp_delta;
				Y = i;
			}
		}
	}

	return Math.max(Y, 0);
}


function initFiltersKey(N,E,mbuffer,T,K,Z,Y, mfilter_bits,P,leveltier, isOptimalFPR, X=0, LLBushK=2, LLBushT=2, filter_array=[]){
  var filter_array_flag = (filter_array.length != 0)
	var L;
	if(filter_array_flag){
		for(var i=0;i<filter_array.length;i++){
			filter_array[i].nokeys=0;
		}
		L = filter_array.length;
	}
	var remainingKeys=N-mbuffer/E;
	if(leveltier < 4){ // origin website algorithm to construct the tree
		var level = L - 1;
		if(!filter_array_flag){
			L = Math.ceil(Math.log(N*E*(T - 1)/mbuffer/T+ 1/T)/Math.log(T));
			for(var i=0;i<L;i++){
				var newFilter = new Filter();
				newFilter.nokeys=0;
				newFilter.fp=0.0;
				filter_array.push(newFilter);
			}
			level = L - 2;
		}


		filter_array[L-1].nokeys+=N;
		var remainingKeys = X -  mbuffer/E;
		if(remainingKeys < 0){
			remainingKeys = 0;
		}


		while(true){
			var tmpLevel = 1;
			var tmp = mbuffer/E*T;
			var prev = mbuffer/E;
			while(remainingKeys > tmp && tmpLevel <= level){
				prev = tmp;
				tmp *= T;
				tmpLevel += 1;
			}
			if(remainingKeys <= tmp && tmpLevel == 1){
				filter_array[0].nokeys += remainingKeys;
				break;
			}else{
					if(tmpLevel != L){
						filter_array[tmpLevel - 1].nokeys += Math.ceil(Math.min(Math.floor(remainingKeys/prev), T)*prev);
					}else{
						filter_array[tmpLevel - 1].nokeys += Math.ceil(Math.min(Math.floor(remainingKeys/prev), T)*prev);
					}

					remainingKeys -= filter_array[tmpLevel - 1].nokeys;
					level -= 1;

			}
		}
	}else{

		var level = L - 1;
		if(!filter_array_flag){
			L = getLLBushL(N+X, E, mbuffer, LLBushK, LLBushT);
			for(var i=0;i<L;i++){
				var newFilter = new Filter();
				newFilter.nokeys=0;
				newFilter.fp=0.0;
				filter_array.push(newFilter);
			}
			level = L - 2;
		}


		filter_array[L-1].nokeys+=N;
		var remainingKeys = X -  mbuffer/E;
		if(remainingKeys < 0){
			remainingKeys = 0;
		}


		while(true){
			var tmpLevel = 1;
			var tmp = mbuffer/E*Math.pow(LLBushT, Math.pow(2, L - 2));
			var prev = mbuffer/E;
			while(remainingKeys > tmp && tmpLevel <= level){
				prev = tmp;
				tmp *= Math.pow(LLBushT, Math.pow(2, L-tmpLevel-2));
				tmpLevel += 1;
			}
			if(remainingKeys <= tmp && tmpLevel == 1){
				filter_array[0].nokeys += remainingKeys;
				break;
			}else{
					if(tmpLevel != L){
						filter_array[tmpLevel - 1].nokeys += Math.ceil(Math.min(Math.floor(remainingKeys/prev), Math.pow(LLBushT, Math.pow(2, L-tmpLevel-1)))*prev);
					}else{
						filter_array[tmpLevel - 1].nokeys += Math.ceil(Math.min(Math.floor(remainingKeys/prev), LLBushK)*prev);
					}

					remainingKeys -= filter_array[tmpLevel - 1].nokeys;
					level -= 1;

			}
		}
	}
	return filter_array;
}


// TODO for tiering, we now assume there are (T-1) runs in the last level are all equal to each other in size,
// but if the last level is not full to capacity, then there may in reality be less than (T-1) runs, and they
// may have different sizes. To fix this problem, we can insert multiple runs per filter to the filters_array
// until the number of remaining keys is 0.
function initFilters(N,E,mbuffer,T,K,Z,Y, mfilter_bits,P,leveltier, isOptimalFPR, X=0, LLBushK=2, LLBushT=2) {
    var filter_array = initFiltersKey(N,E,mbuffer,T,K,Z,Y, mfilter_bits,P,leveltier, isOptimalFPR, X, LLBushK, LLBushT);

		if(leveltier != 4){
			var mem_level = filter_array.length - Y;
			for (var i=0;i<mem_level;i++)
			{
					filter_array[i].mem=mfilter_bits/mem_level;
			}
			for (var i=mem_level;i<filter_array.length;i++){
				filter_array[i].mem= 0;
			}
		}else{
			var mem_level = 0;
			for(var i=0;i<filter_array.length;i++){
				if(filter_array[i].nokeys != 0){
					mem_level+=1;
				}
			}
			for(var i=0;i<filter_array.length;i++){
				if(filter_array[i].nokeys != 0){
					filter_array[i].mem=mfilter_bits/mem_level;
				}else{
					filter_array[i].mem=0;
				}
			}

		}
		return filter_array;
}


function getBaselineFPassigment(N,E,mbuffer,T,K, Z, Y, mfilter_bits,P,leveltier, X=0, LLBushK=2, LLBushT=2)
{
	  var THRESHOLD = 1e-15
    var filter_array = initFilters(N,E,mbuffer,T,K, Z, Y, mfilter_bits,P,leveltier, false, X, LLBushK, LLBushT);

    // console.log(filter_array);
		var mem_level = filter_array.length - Y;
    var limit_on_M=mfilter_bits/mem_level; //amount of memory for filters in bits
    var diff = mfilter_bits;
    var change = true;
    var iteration = 0;

    while (diff > 1) {
        change = false;
        for (var i = 0; i < mem_level - 1; i++) {
            for (var j = i + 1; j < mem_level ; j++) {
							var flag = 0;
                var f1_orig = calc_R(filter_array[i]);
                var f2_orig = calc_R(filter_array[j]);
                // console.log(f1_orig+', '+f2_orig)
                var diff_orig = Math.abs(f1_orig - f2_orig);

                filter_array[i].mem += diff;
                filter_array[j].mem -= diff;

                var f1_new = calc_R(filter_array[i]);
                var f2_new = calc_R(filter_array[j]);
                var diff_new = Math.abs(f1_new - f2_new);
                // console.log(f1_new+', '+f2_new)


                if (diff_orig - diff_new >  THRESHOLD && filter_array[j].mem > 0 && filter_array[i].mem > 0) {
                    change = true;
										continue;
                }
                filter_array[i].mem -= diff * 2;
                filter_array[j].mem += diff * 2;

                f1_new = calc_R(filter_array[i]);
                f2_new = calc_R(filter_array[j]);
                diff_new = Math.abs(f1_new - f2_new);

                if (diff_orig - diff_new>  THRESHOLD	 && filter_array[j].mem > 0 && filter_array[i].mem > 0) {
                    change = true;
                    continue;
                }
								filter_array[i].mem += diff;
                filter_array[j].mem -= diff;

            }
        }
        if (!change) {
            diff /= 2;
        }
        iteration++;
    }
    for (var i = 0; i < filter_array.length; i++) {
        filter_array[i].fp = calc_R(filter_array[i]);
        // console.log(filter_array[i].mem+', '+filter_array[i].fp)
    }
    return filter_array;
}


function getMonkeyFPassigment(N, E, mbuffer, T, K, Z, Y, mfilter_bits, P, leveltier, isOptimalFPR=1, r=1, v=0, X=0, LLBushK=2, LLBushT=2)
{
		var THRESHOLD = 1e-15;
    var filter_array = initFilters(N,E,mbuffer,T,K, Z, Y, mfilter_bits,P,leveltier, true, X, LLBushK, LLBushT);
		var mem_level = filter_array.length - Y;
    // console.log(filter_array);
    var limit_on_M=mfilter_bits/filter_array.length; //amount of memory for filters in bits
    var diff = limit_on_M;
    var change = true;
    var iteration = 0;
    var current_R = eval_R(filter_array, leveltier, T, Y, K, Z, false, LLBushK, LLBushT);
		var current_Value;
		if(isOptimalFPR == 1){
			current_Value = current_R;
		}else{
			current_Value = (r*current_R + v*eval_R(filter_array, leveltier, T, Y, K, Z, true, LLBushK, LLBushT))/(r+v);
		}
    var original = current_Value;
    var value = 0;
    while (diff > 1) {
        change = false;
        for (var i = 0; i < mem_level - 1; i++) {
            for (var j = i + 1; j < mem_level ; j++) {
							  var flag = 0;
                filter_array[i].mem += diff;
                filter_array[j].mem -= diff;
								var R, V;
                R = eval_R(filter_array, leveltier, T, Y, K, Z, false, LLBushK, LLBushT);
								if(isOptimalFPR == 2){
									value = (r*R + v*eval_R(filter_array, leveltier, T, Y, K, Z, true, LLBushK, LLBushT))/(r+v);
								}else{
									value = R;
								}
                if (current_Value - value > THRESHOLD && value > 0 && filter_array[j].mem > 0 ) {
                    current_Value = value;
                    change = true;
										continue;
                }
                filter_array[i].mem -= diff * 2;
                filter_array[j].mem += diff * 2;

								R = eval_R(filter_array, leveltier, T, Y, K, Z, false, LLBushK, LLBushT);
								if(isOptimalFPR == 2){
									value = (r*R + v*eval_R(filter_array, leveltier, T, Y, K, Z, true, LLBushK, LLBushT))/(r+v);
								}else{
									value = R;
								}

                if (current_Value - value > THRESHOLD && value > 0 && filter_array[i].mem > 0 ) {
                    current_Value = value;
                    change = true;
										continue;
                }

								filter_array[i].mem += diff;
                filter_array[j].mem -= diff;

            }
        }
        if (!change) {
            diff /= 2;
        }
        iteration++;
    }

    for (var i = 0; i < filter_array.length; i++) {
        filter_array[i].fp = calc_R(filter_array[i]);
    }

    return filter_array;
}



function eval_R(filters, leveltier, T, Y, K, Z, vflag=false, LLBushK, LLBushT)
{
    var total = 0;
    var n = filters.length;
		if(leveltier == 0){
			K = Math.ceil(T - 1);
			Z = K;
		}else if(leveltier == 1){
			K = 1;
			Z = 1;
		}else if(leveltier == 2){
			K = Math.ceil(T - 1);
			Z = 1;
		}
    n -= Y + 1;
    for (var i = 0; i < n ; i++)
    {
        var val = calc_R(filters[i]);
				if(leveltier < 4){
					total += val * K;
				}else{
					total += val * Math.pow(LLBushT, Math.pow(2, n - 1 - i));
				}

    }
		var last_level_fpr = 1;
    if(Y < filters.length){
			var val = calc_R(filters[n]);
			if(leveltier < 4){
				total += val * Z;
			}else{
				total += val;
			}

			if(Y <= 0 && vflag){
				last_level_fpr = val;
			}
		}

		if(vflag){
			return total+Y*Z - last_level_fpr*Math.ceil(Z/2) + 1;
		}else if(leveltier < 4){
			return total+Y*Z;
		}else{
			return total;
		}

}

function reset_button_colors()
{
	var color='#777';
    //document.getElementById("scenario1").style.background=color;
    //document.getElementById("scenario2").style.background=color;
    //document.getElementById("scenario3").style.background=color;
}

function initScenario1(){
	// LSH-Table
	document.getElementById("lsh_table_mbuffer").value=2; //in MB
	document.getElementById("lsh_table_gc_threshold").value=0.5;
	scenario1();
}

function initScenario2(){
	// LSM-bush
	document.getElementById("lsm_bush_mbuffer").value=2; //in MB
	document.getElementById("lsm_bush_L").readOnly=true;
	document.getElementById("lsm_bush_L").value=3;
	document.getElementById("lsm_bush_mfence_pointer_per_entry").value=8*8/(4096/16);
	document.getElementById("lsm_bush_mfilter_per_entry").value= 10 // bits per element
	document.getElementsByName("lsm_bush_type")[0].checked=true;
	document.getElementsByName("lsm_bush_type")[1].checked=false;
	document.getElementsByName("lsm_bush_type")[2].checked=false;
	document.getElementById("lsm_bush_T").value = 55.7982237;
	document.getElementById("lsm_bush_T").readOnly=true;
	document.getElementById("lsm_bush_K").value = 2;
	scenario2();
}

function initScenario3(){
	// LSM-Tree
	document.getElementById("lsm_tree_mbuffer").value=2; //in MB
	document.getElementById("lsm_tree_L").readOnly=true;
	document.getElementById("lsm_tree_mfence_pointer_per_entry").value=8*8/(4096/16);
	document.getElementById("lsm_tree_mfilter_per_entry").value=10; //0 bits per element
	document.getElementsByName("lsm_tree_type")[0].checked=true;
	document.getElementsByName("lsm_tree_type")[1].checked=false;
	document.getElementById("lsm_tree_L").value=6;
	document.getElementById("lsm_tree_T").value=8.8009868;
	scenario3();
}

function init(){
	// Dataset and Environment
    document.getElementById("N").value=numberWithCommas(68719476736); //(10M values)
    document.getElementById("E").value=16;
		document.getElementById("P").value=4096; //in B
		document.getElementById("Key-Size").value=8;
		document.getElementById("read-latency").value = 20;
		document.getElementById("write-latency").value = 100;

	// Workload
	document.getElementById("s").value = 8192;
	document.getElementById("w").value = 0.5;
	document.getElementById("r").value = 0.0;
	document.getElementById("v").value = 0.499999;
	document.getElementById("qL").value = 0.000001;
	//document.getElementById("X").value = numberWithCommas(0);

	initScenario1();
	initScenario2();
	initScenario3();

	reset_button_colors();

}

function scenario1()
{
	var inputParameters = parseInputTextBoxes();
	var E = inputParameters.E;
	var N = inputParameters.N;
	var key_size = inputParameters.key_size;
	var hash_table_gc_threshold=inputParameters.hash_table_gc_threshold;
	var mbuffer = parseFloat(document.getElementById("lsh_table_mbuffer").value)*1048576;

		var result_div=document.getElementById("lsh_table_result");
		removeAllChildren(result_div);

		var div_row1=document.createElement("div");
		div_row1.setAttribute("class","col-sm-12")
		div_row1.setAttribute("style","text-align: center;height:70px;")
		var div_col1 = document.createElement("div");
		div_col1.setAttribute("class","col-sm-4");
		var hash_table_img = document.createElement("img");
		hash_table_img.setAttribute("class","img-responsive img-centered")
		hash_table_img.setAttribute("style","width:60px;");
		hash_table_img.src='./images/hash_table.png';
		div_col1.appendChild(hash_table_img);
		div_col1.setAttribute("data-tooltip","All entries are kept in the hashing table. The allocated memory for hashing table is " + formatBytes(
			N*key_size, 1) + ".");
		div_col1.setAttribute("data-tooltip-position","top");
		div_row1.appendChild(div_col1);
		var div_col2 = document.createElement("div");
		div_col2.setAttribute("class","col-sm-4");
		var buffer_img = document.createElement("img");
		buffer_img.setAttribute("class","img-responsive img-centered")
		buffer_img.setAttribute("style","width:60px;");
		buffer_img.src='./images/buffer.png';
		div_col2.appendChild(buffer_img);
		div_col2.setAttribute("data-tooltip","Buffer Level contains " + numberWithCommas(Math.floor(mbuffer/E)) + " entries.");
		div_col2.setAttribute("data-tooltip-position","top");
		div_row1.appendChild(div_col2);

		var div_row2=document.createElement("div");
		div_row2.setAttribute("class","col-sm-12")
		div_row2.setAttribute("style","text-align: center;height:38px");
		message = "LSM-Table maintains an in-memory hash table that maps from each key to its corresponding entry in the log."
		div_row2.setAttribute("data-tooltip", message);
		div_row2.setAttribute("data-tooltip-position", "left");

		var button=document.createElement("button");
		button.textContent = "LSH-Table";
		button.setAttribute("class","lsm_button");
		button.setAttribute("style","width: 75%; height: 36px");
		div_row2.appendChild(button);

		var span =document.createElement("span");
		span.setAttribute("style", "width:8%; font-size: 20px; color: #a51c30; padding: 0px 2px");
		span.textContent=" ...";
		div_row2.appendChild(span);

		var button=document.createElement("button");
		button.setAttribute("class","lsm_button");
		button.setAttribute("style","width: 17%; height: 36px");
		div_row2.appendChild(button);



		result_div.append(div_row1);
		result_div.append(div_row2);

		lsh_table_cost();

		// reset_button_colors();
		// document.getElementById("scenario1").style.background='#000000';
}

function scenario2()
{
		var result_div=document.getElementById("lsm_bush_result");
		draw_lsm_graph("lsm_bush");

		// reset_button_colors();
		// document.getElementById("scenario2").style.background='#000000';
}

function scenario3()
{
		var result_div=document.getElementById("lsm_tree_result");
		draw_lsm_graph("lsm_tree");
    // reset_button_colors();
		// document.getElementById("scenario3").style.background='#000000';

}


function draw_lsm_graph(prefix) {

	var inputParameters = parseInputTextBoxes(prefix);


    var N=inputParameters.N;
    var E=inputParameters.E;
		var key_size=inputParameters.key_size;
    var mbuffer=inputParameters.mbuffer;
    var T=inputParameters.T;
    var mfilter_per_entry=inputParameters.mfilter_per_entry;
		var mfence_pointer_per_entry=inputParameters.mfence_pointer_per_entry;
		var hash_table_gc_threshold=inputParameters.hash_table_gc_threshold;
    var P=inputParameters.P;
    var leveltier=inputParameters.leveltier;
		var K = inputParameters.fluidK;
		var Z = inputParameters.fluidZ;
		var s = inputParameters.s;
		var isOptimalFPR = inputParameters.isOptimalFPR;
		var Mu = inputParameters.Mu;
		var read_latency = inputParameters.read_latency;
		var write_latency = inputParameters.write_latency;
		var B = P/E;
		var w=inputParameters.w;
		var v=inputParameters.v;
		var r=inputParameters.r;
		var qL=inputParameters.qL;
		var qS=inputParameters.qS;
		var lsm_bush_K=inputParameters.lsm_bush_K;
		var X=inputParameters.X;


			var L;
			if(leveltier < 4){
				L = Math.ceil(Math.log(N*E*(T - 1)/mbuffer/T+ 1/T)/Math.log(T));
			}else if(leveltier == 4){
				L = getLLBushL(N, E, mbuffer, lsm_bush_K, T);
			}else{
				L = inputParameters.L;
			}
			var Y = 0;
			if(leveltier < 4){
				Y = calc_Y(mfilter_per_entry, K, Z, T, L)
			}

	    //get BF allocation
			var mfilter_bits = mfilter_per_entry*N;
			var tmp_mfilter_bits = mfilter_bits;
			var filters;
			var tmpX = X;
	 		if(leveltier >= 4){
				var tmpN = Math.ceil(mbuffer/E*lsm_bush_K*Math.pow(T, Math.pow(2, L - 1) - 1));
				//tmp_mfilter_bits = tmp_mfilter_bits/N*tmpN;
				tmpX = Math.floor(getLLBushN(L, E, mbuffer, lsm_bush_K, T) - tmpN);
				X = N - tmpN;
				N = tmpN;
			}else{
				var tmpN = mbuffer/E*Math.pow(T, L-1)
				tmpX = N - Math.floor(Math.min(Math.floor(N/tmpN), T)*tmpN);
				N = Math.ceil(Math.min(Math.floor(N/tmpN), T)*tmpN);
			}

			if(isOptimalFPR == 0){
				filters = getBaselineFPassigment(N, E, mbuffer, T, K, Z, Y,tmp_mfilter_bits, P, leveltier, tmpX, lsm_bush_K, T);
			}else{
				filters = getMonkeyFPassigment(N, E, mbuffer, T, K, Z, Y, tmp_mfilter_bits, P, leveltier, isOptimalFPR, r, v, tmpX, lsm_bush_K, T);
			}

			N = inputParameters.N;
			if(leveltier >= 4){
				filters = initFiltersKey(0,E,mbuffer,T,K,Z,Y, mfilter_bits,P,leveltier, isOptimalFPR, N, lsm_bush_K, T, filters);
			}


	    //google.charts.setOnLoadCallback(drawChart);

	//present it nicely in the html!
    var result_div=document.getElementById(prefix+"_result")
		removeAllChildren(result_div);

	// var isMobile;
	// if (window.matchMedia)
	// {
	// 		isMobile = window.matchMedia('(max-device-width: 768px)').matches;
	// }
	// else
	// {
	// 		isMobile = screen.width <= 768;
	// }
	//
	// if (window.matchMedia)
	// {
	// 		isMobile = window.matchMedia('(max-device-width: 768px)').matches;
	// }
	// else
	// {
	// 		isMobile = screen.width <= 768;
	// }
	//
	// console.log(screen.width)

	var div_row0=document.createElement("div");
	div_row0.setAttribute("class","row")
	div_row0.setAttribute("style","text-align: center;height:70px;");
	var div_col1 = document.createElement("div");
	div_col1.setAttribute("class","col-sm-4");
	var bloom_filter_img = document.createElement("img");
	bloom_filter_img.setAttribute("class","img-responsive img-centered");
	bloom_filter_img.setAttribute("style","width:60px;margin-right:10px");
	div_col1.setAttribute("data-tooltip","The memory allocated for bloom filters across all levels is " + formatBytes(mfilter_bits/8) + ".");
	div_col1.setAttribute("data-tooltip-position","top");
	bloom_filter_img.src='./images/filters.png';
	div_col1.appendChild(bloom_filter_img);
	var div_col2 = document.createElement("div");
	div_col2.setAttribute("class","col-sm-4");
	var buffer_img = document.createElement("img");
	buffer_img.setAttribute("class","img-responsive img-centered")
	buffer_img.setAttribute("style","width:60px;");
	buffer_img.src='./images/buffer.png';
	div_col2.appendChild(buffer_img);
	div_col2.setAttribute("data-tooltip","Buffer Level contains " + numberWithCommas(Math.floor(mbuffer/E)) + " entries.");
	div_col2.setAttribute("data-tooltip-position","top");
	var div_col3 = document.createElement("div");
	div_col3.setAttribute("class","col-sm-4");
	var fence_pointer_img = document.createElement("img");
	fence_pointer_img.setAttribute("class","img-responsive img-centered")
	fence_pointer_img.setAttribute("style","width:60px;margin-left:10px");
	div_col3.setAttribute("data-tooltip","The memory allocated for fence pointers across all levels is " + formatBytes(N*key_size*mfence_pointer_per_entry/8) + ".");
	div_col3.setAttribute("data-tooltip-position","top");
	fence_pointer_img.src='./images/sign.png';
	div_col3.appendChild(fence_pointer_img);
	div_row0.appendChild(div_col1);
	div_row0.appendChild(div_col2);
	div_row0.appendChild(div_col3);
	result_div.append(div_row0);



	// var div_row1=document.createElement("div");
	// div_row1.setAttribute("class","row")
	// div_row1.setAttribute("style","text-align: center;height:38px");
	// var button=document.createElement("button");
	// button.setAttribute("class","lsm_button lsm_button_buffer");
	// button.setAttribute("data-tooltip","Buffer Level contains " + numberWithCommas(Math.floor(mbuffer/E)) + " entries.")
	// button.setAttribute("data-tooltip-position","left");
	// var text;
	/*
	if(leveltier != 4 || X >=  Math.floor(mbuffer/E)){
		text = document.createTextNode(numberWithCommas(Math.floor(mbuffer/E)))
	}else{
		text = document.createTextNode(X)
	}*/
	// text = document.createTextNode("");
	// button.appendChild(text);
	// div_row1.appendChild(button);
	// result_div.append(div_row1);

	var max_button_size=420;
	if (screen.width<=1200)
	{
			max_button_size=Math.max(screen.width-700,350);
	}
	var lsm_button_size_ratio=(max_button_size-70)/filters.length;
	var cur_length=70;
	cur_length+=lsm_button_size_ratio;
	if (N<=(mbuffer/E))
	{
		//nothing in LSM tree
//adding the buffer row
	var div_new_row=document.createElement("div");
	div_new_row.setAttribute("class","row");;
			var div_buffer=document.createElement("div");
			div_buffer.setAttribute("class","col-sm-5")
			div_buffer.setAttribute("style","text-align: center;")
			var p4=document.createElement("p");
			p4.setAttribute("style","text-align: center;")
			p4.textContent=("All data entries fit into the buffer")
			var p4b=document.createElement("p");
			p4b.setAttribute("style","text-align: center;")
			p4b.textContent=("Add more entries to see a tree!")
			div_buffer.appendChild(p4);
			div_buffer.appendChild(p4b);
			div_new_row.appendChild(div_buffer);
			result_div.appendChild(div_new_row);

	}else{
		var THRESHOLD=1e-9;
		var last_is_smaller=false;
		var full_runs_in_last_level=0;
		var L = filters.length;
		var previous_entries=mbuffer/E;


		for (var i=0;i<L;i++){
			if(leveltier >= 4){
				K = Math.floor(Math.pow(T, Math.pow(2, L - i - 2)));
				Z = 1;
			}

			if(leveltier >= 4){
				var tmp_previous_entries = previous_entries;
				if(i < L - 1){
					previous_entries *= Math.pow(T, Math.pow(2, L - 2 - i));
				}else{
					previous_entries *= lsm_bush_K;
				}
				message  = "The capacity of this level is " + numberWithCommas(Math.round(previous_entries)) + " entries."
			}else{
				var tmp_previous_entrie;
				previous_entries *= T;
				if(i < L - 1){
					tmp_previous_entries = previous_entries/K;
				}else{
					tmp_previous_entries = previous_entries/Z;
				}
			}

			var div_new_row=document.createElement("div");
			div_new_row.setAttribute("class","row");

			var div_lsm_runs=document.createElement("div");
			div_lsm_runs.setAttribute("style","text-align: center;height:38px");
			div_new_row.appendChild(div_lsm_runs);

			var levelcss=i+1;
			if (L<5)
				levelcss=5-L+1+i;
						// console.log(i+":"+levelcss)
						var n;
							if (i >= filters.length-Y-1) {
								maxRuns = Z;
								n = Math.min(Z, 7);
							} else {
								maxRuns = K;
								n = Math.min(K, 7);
							}

								for (var j = 0; j < n; j++) {
										if (maxRuns > 6 && j == 5) {
												var span =document.createElement("span");
												var message="This level contains "+maxRuns+" runs";
												span.setAttribute("data-tooltip", message);
												span.setAttribute("data-tooltip-position", "left");
												span.setAttribute("style", "width:19.27px; font-size: 20px; color: #a51c30; padding: 0px 2px");
												span.id = i + "span";
												span.textContent=" ...";
												div_lsm_runs.appendChild(span);
										} else {
												var button=document.createElement("button");
									button.setAttribute("class","lsm_button lsm_button"+(levelcss));

									button.setAttribute("class","lsm_button");

									var full_flag=true;
									// when some buttons are not full
									// if(leveltier < 4){
									// 		if((j+1)*tmp_previous_entries > filters[i].nokeys || (j == n-1 && previous_entries > filters[i].nokeys)){
									// 			full_flag = false;
									// 			button.setAttribute("class","lsm_button_not_solid");
									// 		}
									// }else{
									//
									// 	if(filters[i].nokeys == 0){
									// 		full_flag = false;
									// 		button.setAttribute("class","lsm_button_empty");
									// 	}else if(((j+1)*tmp_previous_entries > filters[i].nokeys) || (j == n-1 && previous_entries > filters[i].nokeys)){
									// 		full_flag = false;
									// 		button.setAttribute("class","lsm_button_not_solid");
									// 	}
									// }


										if(maxRuns >= 7){
											button.setAttribute("style","width: "+(cur_length- 19.27)/6+"px; height: 36px");
										}else{
											button.setAttribute("style","width: "+cur_length/n+"px; height: 36px");
										}
										var message="";
										if(leveltier >= 4){
											if(i == L || maxRuns == 1){
												message+="There is only one run in this level. ";
											}else{
												message+="There are " + maxRuns + " runs in this level. ";
											}
										}

										var capacity;
										if(leveltier < 4){
											capacity = Math.pow(T, i+1)*mbuffer/E;
										}else{
											capacity = previous_entries;
										}
										if(!full_flag){
											message += "At this level, each run contains "+numberWithCommas(Math.floor(capacity/maxRuns))+" entries. The level is not full and only "+ (filters[i].nokeys*100/capacity).toExponential(3)+"% of its capacity (" + (Math.floor(filters[i].nokeys/(capacity/maxRuns))) + " run(s) ) are filled."
										}else{
											message += "At this level, each run contains "+numberWithCommas(Math.floor(capacity/maxRuns))+" entries.";
										}



												button.setAttribute("data-tooltip", message);
												button.setAttribute("data-tooltip-position", "left");
												div_lsm_runs.appendChild(button);
										}
								}
								cur_length+=lsm_button_size_ratio;

								result_div.appendChild(div_new_row);
		}

	}

    // var hr=document.createElement("hr");
    // result_div.appendChild(hr)

		// calculate the total cost
		THRESHOLD = 1e-15;

		var style_array= [
			"text-align: center",
			"text-align: center",
			"text-align: center",
			"text-align: center",
			"text-align: center"
		];
		var sum=w+qL+v+r;
		var coefficient_array = [
			write_latency*w/sum,
			read_latency*qL/sum,
			read_latency*v/sum,
			read_latency*r/sum,
			0
		];

		var text_array = [
			"Update",
			"Long Range Lookup",
			"Existing Point Lookup",
			"Zero-result Point Lookup",
			//"Space Amplification"
			"Memory"
		];

		var id_suffix_array = [
			"_write",
			"_long_range_lookup",
			"_existing_point_lookup",
			"_zero_result_lookup",
			"_memory",
		]

		var total_function_array = [
			getTotalUpdateCost,
			getTotalLongRangeLookupCost,
			getTotalExistingPointLookupCost,
			getTotalNonExistingPointLookupCost,
			getTotalMemory
			//getTotalSpaceAmp
		];

		var total_cost=0;

		for(j=0;j<=4;j++){
			var div_tmp=document.getElementById(prefix+id_suffix_array[j]);
			removeAllChildren(div_tmp);
			div_tmp.setAttribute("style",style_array[j]);
			var p_tmp=document.createElement("p");
			var span_tmp=document.createElement("span");

			var cost = total_function_array[j](i+1, mbuffer/E, L, filters, N, T, B, Y, K, Z, s, Mu, isOptimalFPR, leveltier, lsm_bush_K, T, key_size, mfence_pointer_per_entry);
			total_cost += coefficient_array[j]*cost;
			var msg_cost = cost;
			if(cost*1000%1 != 0){
				msg_cost=cost.toExponential(5);
			}
			var threshold_flag=false;
			if(cost > 1e7){
					cost = cost.toExponential(3);
			}else if(cost <= THRESHOLD){
				if(cost != 0){
					threshold_flag=true;
				}
				cost = 0.0;
			}else if(typeof cost == 'number'  && cost*1000 < 1){
				cost = myCeil(cost, 1).toExponential(1)
			}else if(cost*1000%1 != 0){
				cost = (Math.ceil(cost*1000)/1000).toFixed(3)
			}

			var message;
			if(j != 4){
				message = "The total cost of " +text_array[j]+ " is " + 	msg_cost + " I/O(s)."
				cost += " I/O"
			}else{
				message = "The total cost of " +text_array[j]+ " is "  + formatBytes(msg_cost/8,1) + ".";
				cost = formatBytes(msg_cost/8,1);
			}

			if(threshold_flag){
				message += "Because the value here is too small (less than 1e-9), it is noted as 0 in breakdown table. "
			}

			p_tmp.textContent=(cost+"")
			span_tmp.setAttribute("data-tooltip",message);
			span_tmp.setAttribute("data-tooltip-position","bottom")
			if(j != 4){
				p_tmp.setAttribute("style","text-align: center;font-size:15px")
			}else{
				p_tmp.setAttribute("style","text-align: center;font-size:15px;font-weight:bold");
			}

			span_tmp.appendChild(p_tmp);
			div_tmp.appendChild(span_tmp);
		}
		var omega=1e-6;
		var throughput = 1/total_cost/omega;
		if(throughput > Math.pow(10, 8)){
					message=throughput.toExponential(2) + " ops/s";
					message2="Under the specified workload, the throughout is " + throughput.toExponential(6) + " ops/second"
		}else{
					message= throughput.toFixed(1) + " ops/s";
					message2="Under the specified workload, the throughout is " + throughput.toFixed(6) + " ops/second"
		}
		var div_throughput = document.getElementById(prefix+"_throughput");
		removeAllChildren(div_throughput);
		var span_tmp=document.createElement("span");
		var p_tmp = document.createElement("p");
		p_tmp.textContent = message;
		span_tmp.setAttribute("data-tooltip",message2);
		span_tmp.setAttribute("data-tooltip-position","bottom")
		p_tmp.setAttribute("style","text-align: center;font-size:15px;font-weight:bold")
		span_tmp.appendChild(p_tmp);
		div_throughput.appendChild(span_tmp);

}

function lsh_table_cost(){
	var inputParameters = parseInputTextBoxes();

	var N = inputParameters.N;
	var P = inputParameters.P;
	var E = inputParameters.E;
	var B = P/E;
	var key_size=inputParameters.key_size;
	var hash_table_gc_threshold=inputParameters.hash_table_gc_threshold;
	var read_latency = inputParameters.read_latency;
	var write_latency = inputParameters.write_latency;
	var w=inputParameters.w;
	var v=inputParameters.v;
	var r=inputParameters.r;
	var qL=inputParameters.qL;

	THRESHOLD = 1e-15;

	var style_array= [
		"text-align: center",
		"text-align: center",
		"text-align: center",
		"text-align: center",
		"text-align: center"
	];

	lsh_table_array = [
		1/(B*hash_table_gc_threshold),
		N/B,
		"1",
		"0",
		N*key_size*8
	];

	var sum=r+qL+v+w;
	var coefficient_array = [
		write_latency*w/sum,
		read_latency*qL/sum,
		read_latency*v/sum,
		read_latency*r/sum,
		0
	];

	var text_array = [
		"Update",
		"Long Range Lookup",
		"Existing Point Lookup",
		"Zero-result Point Lookup",
		//"Space Amplification"
		"Memory"
	];

	var id_suffix_array = [
		"_write",
		"_long_range_lookup",
		"_existing_point_lookup",
		"_zero_result_lookup",
		"_memory",
	]
	prefix = "lsh_table";
	var total_cost = 0;
	for(j=0;j <= 4;j++){
		var div_tmp = document.getElementById(prefix+id_suffix_array[j]);
		removeAllChildren(div_tmp);
		div_tmp.setAttribute("style",style_array[j])
		var p_tmp=document.createElement("p");
		var span_tmp=document.createElement("span");

		var cost = lsh_table_array[j];
		total_cost += coefficient_array[j]*cost;
		var threshold_flag=false;
		var message;
		var msg_cost = cost;
		if(cost*1000%1 != 0){
			msg_cost=cost.toExponential(5);
		}
		if(cost > 2000){
			cost = cost.toExponential(3)
		}else if(cost <= THRESHOLD){
			if(cost != 0){
				threshold_flag=true;
			}
			cost = 0.0;
		}else if(typeof cost == 'number'  && cost*1000 < 1){
			cost = myFloor(cost, 1).toExponential(1)
		}else if(cost*1000%1 != 0){
			cost = (Math.round(cost*1000)/1000).toFixed(3)
		}


		if(j != 4){
			message = text_array[j] + " at this level has " + msg_cost + " I/O cost(s)."
			cost += " I/O";
		}else{
			message = text_array[j] + " of LSH-Table is " + formatBytes(msg_cost/8,1) + ".";
			cost = formatBytes(msg_cost/8,1);
		}

		if(threshold_flag){
			message += "Because the value here is too small (less than 1e-9), it is noted as 0 in breakdown table. "
		}

		span_tmp.setAttribute("data-tooltip",message);
		span_tmp.setAttribute("data-tooltip-position","bottom")
		if(j != 4){
			p_tmp.setAttribute("style","text-align: center;font-size:15px;")
		}else{
			p_tmp.setAttribute("style","text-align: center;font-size:15px;font-weight:bold");
		}

		p_tmp.textContent=cost
		span_tmp.appendChild(p_tmp);
		div_tmp.appendChild(span_tmp);
		}
		var omega=1e-6;
		var throughput = 1/total_cost/omega;
		if(throughput > Math.pow(10, 8)){
					message=throughput.toExponential(2) + " ops/s";
					message2="Under the specified workload, the throughout is " + throughput.toExponential(6) + " ops/second"
		}else{
					message= throughput.toFixed(1) + " ops/s";
					message2="Under the specified workload, the throughout is " + throughput.toFixed(6) + " ops/second"
		}
		var div_throughput = document.getElementById(prefix+"_throughput");
		removeAllChildren(div_throughput);
		var span_tmp=document.createElement("span");
		var p_tmp = document.createElement("p");
		p_tmp.textContent = message;
		span_tmp.setAttribute("data-tooltip",message2);
		span_tmp.setAttribute("data-tooltip-position","bottom")
		p_tmp.setAttribute("style","text-align: center;font-size:15px;font-weight:bold")
		span_tmp.appendChild(p_tmp);
		div_throughput.appendChild(span_tmp)

}

function getHashTableCost(conf){
	var N=conf.N;
	var B=conf.B;
	var w=conf.w;
	var v=conf.v;
	var r=conf.r;
	var qL=conf.qL;
	var qS=conf.qS;
	var sum=w+v+r+qL+qS;

	coefficient_array = [
		r/sum,
		v/sum,
		qS/sum,
		qL/sum,
		w/sum
	]
	lsh_table_array = [
		0,
		1,
		N/B,
		N/B,
		1/B,
	]
	var result = 0;
	for(var i = 0;i < 5; i++){
		result += coefficient_array[i]*lsh_table_array[i];
	}
	return result;
}

function getTotalCost(conf, L_decimal_flag=false){
	var N=conf.N;
	var M=conf.mfilter;
	var T=conf.T;
	var E=conf.E;
	var key_size=conf.key_size;
	var mbuffer=conf.M-conf.mfilter;
	var B=conf.B;
	var P=conf.P;
	var K = conf.K;
	var Z = conf.Z;
	var s = conf.s;
	var Mu = conf.Mu;
	var mfence_pointer_per_entry = conf.mfence_pointer_per_entry;
	var leveltier=conf.leveltier;
	var LLBushK=conf.LLBushK;
	var LLBushT=conf.LLBushT;
	if(leveltier==0){
		K = Math.ceil(T - 1);
		Z = Math.ceil(T - 1);
	}else if(leveltier == 1){
		K = 1;
		Z = 1;
	}else if(leveltier == 2){
		K = Math.ceil(T - 1);
		Z = 1;
	}

	var w=conf.w;
	var v=conf.v;
	var r=conf.r;
	var qL=conf.qL;
	var qS=conf.qS;
	var sum=w+v+r+qL+qS;
	var L;

	if(L_decimal_flag){
		L = Math.log(N*E*(T - 1)/(mbuffer*T)+ 1/T)/Math.log(T);
	}else{
		L = Math.ceil(Math.log(N*E*(T - 1)/(mbuffer*T)+ 1/T)/Math.log(T));
	}

	var Y = calc_Y(M*8/N, K, Z, T, L);
	var R = get_accurate_R(M, T, N, K, Z, B, P, conf.leveltier);
	var fpr_Z = (R - Y*Z)*(T - 1)/(T - Math.pow(T, Y - L + 1))/Z;
	var V;
	if(Y > 0){
		V = (R - Z) + Math.floor(Z/2) + 1;
	}else{
		V = (R - fpr_Z*Z) + fpr_Z*Math.floor(Z/2) + 1;
	}
	/*
	//1st version
	var W = ((T - 1)*((L - Y - 1)/(K + 1) + (Y + 1.0)/(Z + 1)))/Mu/B;
	var Q = qS*((Y+1)*Z + K*(L - Y - 1));
	for(j = 1; j < L-Y; j++){
		Q += qL*Math.ceil(s/B/Math.pow(T, L - j)/Mu);
	}
	Q += qL*Math.ceil(Z*s/B/Mu)*/

	//2nd version
	var filters = [];
	L = Math.ceil(L);
	var tmpN = mbuffer/E*Math.pow(T, L-1)
	var tmp = Math.min(Math.floor(N/tmpN), T)*tmpN;
	filters = initFiltersKey(Math.ceil(tmp),E,mbuffer,T,K,Z,0, M*8,P,leveltier, 1, N - Math.floor(tmp), LLBushK, LLBushT);
	var initCapacity = mbuffer/E;
	W = getTotalUpdateCost(L+1, initCapacity, L, filters, N, T, B, Y, K, Z, s, Mu, 1, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	var QS = qS*getTotalShortRangeLookupCost(L+1, initCapacity, L, filters, N, T, B, Y, K, Z, s, Mu, 1, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	var QL = qL*getTotalLongRangeLookupCost(L+1, initCapacity, L, filters, N, T, B, Y, K, Z, s, Mu, 1, leveltier, LLBushK, LLBushT, key_size, mfence_pointer_per_entry);
	var Q = QS + QL;
	var total = (w*W + r*R + v*V + Q)/sum;
	return total;


}

function getLLBushT(L, baseN, E, mbuffer, LLBushK){
	return Math.ceil(Math.pow((baseN*E)/(mbuffer*LLBushK), 1/(Math.pow(2, L-1) - 1))*10000000)/10000000;
}

function getLLBushAccurateT(L, N, E, mbuffer, LLBushK){
	function getSumOfProgression(T, L){
		var sum = 0;
		for(var i = 1; i <= L; i++){
			sum += 1/Math.pow(T, Math.pow(2, i-1) - 1);
		}
		return sum;
	}
	var baseNmax = N/(1+1/LLBushK);;
	var baseNmin = N/(1+2/LLBushK);

	var Tmin = getLLBushT(L, baseNmin, E, mbuffer, LLBushK);
	var Tmax = getLLBushT(L, baseNmax, E, mbuffer, LLBushK);
	while(Tmin != Tmax){
		baseNmax = N/(1+ 1/LLBushK*getSumOfProgression(Tmax, L));
		Tmax = getLLBushT(L, baseNmax, E, mbuffer, LLBushK);

		baseNmin = N/(1+ 1/LLBushK*getSumOfProgression(Tmin, L));
		Tmin = getLLBushT(L, baseNmin, E, mbuffer, LLBushK);
	}
	return (Tmin+Tmax)/2;
}

function getLLBushN(L, E, mbuffer, LLBushK, LLBushT){
	var sum = mbuffer/E;
	var previous = sum;
	for(var i=1;i<=L-1;i++){
		previous *= Math.pow(LLBushT,Math.pow(2, L-i-1));
		sum += previous;
	}
	sum += previous*LLBushK;
	return sum;
}

function getLLBushN_baseN(L, N, E, mbuffer, LLBushK, LLBushT){
	var sum = N + N/LLBushK;
	var previous = N/LLBushK;
	for(var i=L-2;i>=1;i--){
		previous /= Math.pow(LLBushT,Math.pow(2, L-i-1));
		sum += previous;
	}
	return sum;
}

function getLLBushL(N, E, mbuffer, LLBushK, LLBushT){
	var L=3;
	while(true){
		var sum=getLLBushN(L, E, mbuffer, LLBushK, LLBushT);
		if(N <= sum){
			break;
		}
		L+=1;
	}
	return L;
}

function getLLBushL2(N, E, mbuffer, LLBushK, LLBushT){
	return Math.ceil(Math.log(Math.log(N/(mbuffer/E)*LLBushT/LLBushK)/Math.log(LLBushT))/Math.log(2))+1;
}

function getLLBushL_baseN(baseN, E, mbuffer, LLBushK, LLBushT){
	var L=3;
	var tmpBaseN = mbuffer/E*Math.pow(LLBushT, 3)*LLBushK;
	while(true){
		if(tmpBaseN < baseN){
				L += 1;
				tmpBaseN *= Math.pow(LLBushT, Math.pow(2, L-2));
		}else{
			return L;
		}
	}
}

function AutoTune_KZ(T, conf){
	var tmpK, tmpZ;
	var tmpK1, tmpZ1;
	var tmpConf_K = AutoTune_GD_test(1, 1, T-1, conf, Math.ceil(T/2), false, Math.round(T/4));
	tmpK = tmpConf_K[1][tmpConf_K[1].length-1];
	conf.K = tmpK;
	var tmpConf_Z = AutoTune_GD_test(2, 1, T-1, conf, Math.ceil(T/2), false, Math.round(T/4));
	tmpZ = tmpConf_Z[1][tmpConf_Z[1].length-1];
	conf.Z = tmpZ;
	while(true){
		tmpConf_K = AutoTune_GD_test(1, 1, T-1, conf, Math.ceil(T/2), false, Math.round(T/4));
		tmpK1 = tmpConf_K[1][tmpConf_K[1].length-1];
		conf.K = tmpK1;
		if(tmpK1 == tmpK){
			break;
		}else{
			tmpK = tmpK1;
		}
		tmpConf_Z = AutoTune_GD_test(2, 1, T-1, conf, Math.ceil(T/2), false, Math.round(T/4));
		tmpZ1 = tmpConf_Z[1][tmpConf_Z[1].length-1];
		conf.Z = tmpZ1;
		if(tmpZ1 == tmpZ){
			break;
		}else{
			tmpZ = tmpZ1;
		}

	}
	return conf;
}

function AutoTune_GD_test(adjust_flag, min_value, max_value, conf, start_value=NaN, refine_flag=false, steps=100){
	var tmp, tmp1, tmp2;
	tmp_min = min_value;
	tmp_max = max_value;
	var cost, cost1, cost2;
	var optimal_conf;
	var direction_flag = 0;
	if(isNaN(start_value)){
			tmp = Math.ceil((tmp_max - tmp_min)/2) + min_value;
	}else{
		tmp = parseInt(start_value);
	}
	var tmp_conf;
	do{
		tmp_conf = Object.assign({}, conf);

		if(adjust_flag == 0){
			tmp_conf.T = tmp;
			if(refine_flag){
				tmp_conf = AutoTune_KZ(tmp, tmp_conf);
			}
		}else if(adjust_flag == 1){
			tmp_conf.K = tmp;
		}else{
			tmp_conf.Z = tmp;
		}

		cost = getTotalCost(tmp_conf, true);

		tmp_conf = Object.assign({}, conf);
		if(tmp <= min_value){
			cost1 = Number.MAX_VALUE;
		}else{
			if(adjust_flag == 0){
				tmp_conf.T = tmp - 1;
				if(refine_flag){
					tmp_conf = AutoTune_KZ(tmp-1, tmp_conf);
				}
			}else if(adjust_flag == 1){
				tmp_conf.K = tmp - 1;
			}else{
				tmp_conf.Z = tmp - 1;
			}
			cost1 = getTotalCost(tmp_conf, true);
		}

		tmp_conf = Object.assign({}, conf);
		if(tmp >= max_value){
			cost2 = Number.MAX_VALUE;
		}else{
			if(adjust_flag == 0){
				tmp_conf.T = tmp + 1;
				if(refine_flag){
					tmp_conf = AutoTune_KZ(tmp+1, tmp_conf);
				}
			}else if(adjust_flag == 1){
				tmp_conf.K = tmp + 1;
			}else{
				tmp_conf.Z = tmp + 1;
			}
			cost2 = getTotalCost(tmp_conf, true);
		}

		if(cost <= cost1 && cost <= cost2){
			break;
		}
		if(cost2 > cost1){
			if(direction_flag == 1){
				steps = Math.max(1, Math.round(steps/2));
				//steps /= 2;
			}
			direction_flag = -1;
		}else if(cost2 < cost1){
		  if(direction_flag == -1){
				steps = Math.max(1, Math.round(steps/2));
				//steps /= 2;
		  }
			direction_flag = 1;
		}
		var delta = (cost2 - cost1)/2*steps;
		if(delta > 0){
			//tmp = tmp - Math.min(delta, Math.max((tmp - tmp_min)/2, 1));
			tmp = tmp - Math.min(Math.ceil(delta), Math.max(Math.floor((tmp - tmp_min)/2), 1));
		}else{
			//tmp = tmp + Math.min(-delta, Math.max((tmp_max - tmp)/2, 1));
			tmp = tmp + Math.min(-Math.floor(delta), Math.max(Math.floor((tmp_max - tmp)/2), 1));
		}
	}while(tmp < tmp_max && tmp > tmp_min);

	if(tmp > tmp_max){
		tmp = tmp_max;
		outOfRangeFlag = true;
	}else if(tmp < tmp_min){
		tmp = tmp_min;
		outOfRangeFlag = true;
	}

		if(adjust_flag == 0){
			conf.T = tmp;
			if(refine_flag){
				conf = AutoTune_KZ(tmp, conf);
			}
		}else if(adjust_flag == 1){
			conf.K = tmp;
		}else{
			conf.Z = tmp;
		}

		cost = getTotalCost(conf, true);

	optimal_conf = [];
	optimal_conf.push(cost);
	optimal_conf.push([conf, tmp]);

	return optimal_conf;
}

function AutoTuneT(min_value, max_value, conf) {

	var delta_value = Math.ceil((max_value - min_value)/2);
	var tmp, tmp1, tmp2;
	var cost, cost1, cost2;
	var optimal_conf, optimal_conf1, optimal_conf2;
	var unchanged_flag = 4;
	do{
		if(unchanged_flag != 0){
			tmp = min_value + delta_value;
			conf.T = tmp;
			optimal_conf = [];
			optimal_conf.push(getTotalCost(conf, true));
			optimal_conf.push([tmp]);
			cost = optimal_conf[0];
		}

		if(unchanged_flag != 1 && unchanged_flag != 2){

			tmp1 = Math.max(Math.floor(tmp - delta_value), min_value);
			conf.T = tmp1;
			optimal_conf1 = []
			optimal_conf1.push(getTotalCost(conf, true));
			optimal_conf1.push([tmp1]);
			cost1 = optimal_conf1[0];

			tmp2 = Math.min(Math.ceil(tmp + delta_value), max_value);
			conf.T = tmp2;
			optimal_conf2 = []
			optimal_conf2.push(getTotalCost(conf, true));
			optimal_conf2.push([tmp2]);
			cost2 = optimal_conf2[0];

	}
		if(cost1 < cost2 && cost1 < cost){
			max_value = tmp;
			tmp = tmp1;
			cost = cost1;
			optimal_conf = optimal_conf1;
			unchanged_flag = 1;
		}else if(cost2 < cost){
			min_value = tmp;
			tmp = tmp2;
			cost = cost2;
			optimal_conf = optimal_conf2;
			unchanged_flag = 2;
		}else{
			max_value = tmp2;
			min_value = tmp1;
			unchanged_flag = 0;
		}
		delta_value = delta_value/2;

	}while(delta_value >= 1)
	console.log(optimal_conf)
	return optimal_conf
}

function calc_T(N, mbuffer, E, L, precision=1){
	var decimal_number = Math.log(precision)/Math.log(10);
	var THRESHOLD = 1e-15;
	var ratio = N/(mbuffer/E);
	if(L == 1){
		return ratio - 1;
	}
	var Tmin = Math.max(Math.pow(ratio, 1/(L+1)), 2.0);
	if((Math.pow(Tmin, L+1) - 1)/(Tmin - 1) - ratio < THRESHOLD && (Math.pow(Tmin, L+1) - 1)/(Tmin - 1) - ratio >= 0){
		return (Math.ceil(Tmin*precision)/precision).toFixed(decimal_number);
	}
	var Tmax = Math.pow(ratio, 1/L);
	if((Math.pow(Tmax, L+1) - 1)/(Tmax - 1) - ratio < THRESHOLD && (Math.pow(Tmax, L+1) - 1)/(Tmax - 1) - ratio >= 0){
		return (Math.ceil(Tmax*precision)/precision).toFixed(decimal_number);
	}
	var tmpT, tmpRatio;
	while(Tmax - Tmin > 1/precision){
		tmpT = (Tmax + Tmin)/2;
		tmpRatio = (Math.pow(tmpT, L+1) - 1)/(tmpT - 1);
		if(tmpRatio - ratio < THRESHOLD && tmpRatio - ratio >= 0){
			return (Math.ceil(tmpT*precision)/precision).toFixed(decimal_number);
		}else if(tmpRatio < ratio){
			Tmin = tmpT;
		}else{
			Tmax = tmpT;
		}
	}
	return (Math.ceil(Tmax*precision)/precision).toFixed(decimal_number);
}

function AutoTuneL(conf, tree_types_array){
	var optimal_conf = []
	var tmp_conf;
	var cost = Number.MAX_VALUE;
	var Lmax = Math.ceil((Math.log(conf.N/(2*(conf.M-conf.mfilter)/conf.E)+ 1/2)/Math.log(2)).toFixed(4));
	var T_dict = {};//{T:[L, deviation]}
	for(var L=1;L<=Lmax;L++){
		var tmp_T = calc_T(conf.N, (conf.M-conf.mfilter), conf.E, L, 10000001);
		T_dict[tmp_T] = [L];
	}
	for(var T in T_dict){
		var tmp_conf = Object.assign({}, conf);
			tmp_conf.T = T;
			for(var j=0;j<tree_types_array.length;j++){
				tmp_conf.leveltier=tree_types_array[j];
				if(conf.leveltier == 3){
					tmp_conf = AutoTune_KZ(Math.floor(T), tmp_conf);
				}
				var tmp_cost=getTotalCost(tmp_conf, true);
				if(tmp_cost < cost){
					cost = tmp_cost;
					optimal_conf = []
					conf = Object.assign({}, tmp_conf);
					optimal_conf.push(cost);
					optimal_conf.push([conf, T_dict[T][0], T])
				}
			}
	}

	console.log(optimal_conf);
	return optimal_conf;
}


function AutoTuneL_LSM_Bush(conf){

	var N=conf.N;
	var T=conf.T;
	var E=conf.E;
	var mbuffer=conf.mbuffer;
	var mfilter=conf.mfilter;
	var mfence_pointer_per_entry = conf.mfence_pointer_per_entry;
	var key_size=conf.key_size;
	var P=conf.P;
	var leveltier=conf.leveltier;
	var K = conf.fluidK;
	var Z = conf.fluidZ;
	var s = conf.s;
	var Mu = conf.Mu;
	var B = P/E;
	var w=conf.w;
	var v=conf.v;
	var r=conf.r;
	var qL=conf.qL;
	var qS=conf.qS;
	var LLBushK=conf.LLBushK == undefined ? 2 : conf.LLBushK;
	var isOptimalFPR=conf.isOptimalFPR;

	var total_function_array = [
		getTotalNonExistingPointLookupCost,
		getTotalExistingPointLookupCost,
		getTotalShortRangeLookupCost,
		getTotalLongRangeLookupCost,
		getTotalUpdateCost,
	]

	var sum = r + v + qS + qL + w;

	var coefficient_array = [
		r/sum,
		v/sum,
		qS/sum,
		qL/sum,
		w/sum
	]


	var optimal_conf = []
	var cost = Number.MAX_VALUE;
	var filters = [];
	var Lmax = Math.ceil(Math.log(Math.log(N*E/mbuffer)/Math.log(2))/Math.log(2));
	for(var tmpL=3; tmpL <= Lmax;tmpL++){
		var tmp_conf = Object.assign({}, conf);
		LLBushT = getLLBushAccurateT(tmpL, N, E, mbuffer, LLBushK);
		baseN = Math.ceil(mbuffer/E*LLBushK*Math.pow(LLBushT, Math.pow(2, tmpL-1)-1));
		tmpX = Math.floor(getLLBushN(tmpL, E, mbuffer, LLBushK, LLBushT) - baseN);
		filters = getMonkeyFPassigment(baseN, E, mbuffer, T, K, Z, 0, mfilter*8, P, 5, isOptimalFPR, r, v, tmpX, LLBushK, LLBushT);
		filters = initFiltersKey(0,E,mbuffer,T,K,Z,0, mfilter*8,P,5, isOptimalFPR, N, LLBushK, LLBushT, filters);
		var tmpCost = 0;
		for(var i = 0; i < 5; i++){
			tmpCost += total_function_array[i](tmpL+1, mbuffer/E, tmpL, filters, N, T, mbuffer/P/E, 0, K, Z, s, Mu, isOptimalFPR, 5, LLBushK, LLBushT, key_size, mfence_pointer_per_entry)*coefficient_array[i];
		}
		if(tmpCost < cost){
			optimal_conf = [];
			cost = tmpCost;
			optimal_conf.push(cost);
			optimal_conf.push([tmpL, LLBushT])
		}
	}
	console.log(optimal_conf);
	return optimal_conf;
}
//////////////////////////////////////
//AUX HOLISTIC TUNING FUNCTIONS

function LSM_config() {
    var P;
    var T;
    var L;
    var N;
    var R;
    var W;
    var M;
    var B;
    var E;
		var key_size;
		var K;
		var Z;
		var Y;
		var Mu;
		var mfilter;
		var mbuffer;
		var leveltier;
    var valid;
    var throughput;
    var num_levels;
		var s;
		var r;
		var v;
		var w;
		var qL;
		var qS;
		var isOptimalFPR;
}

// returns write cost
function get_W(M, N, T, K, Z, B, P, Mu, leveltier) {
	if(leveltier==0){
		K = Math.ceil(T - 1);
		Z = Math.ceil(T - 1);
	}else if(leveltier == 1){
		K = 1;
		Z = 1;
	}else if(leveltier == 2){
		K = Math.ceil(T - 1);
		Z = 1;
	}

    if (P * B >= N) {
        return 0;
    }
		M = M*8;
		var L = Math.log(N*(T - 1)/(B*P*T)+ 1/T)/Math.log(T);
		var Y = calc_Y(M/N, K, Z, T, L);
		if(L < 1 && leveltier == 0){
			return L*(T-1)/(Z+1)/(Mu*B);
		}
    var result = (T - 1)*((L - Y - 1)/(K + 1) + (Y + 1.0)/(Z + 1))/(Mu*B);
    return result;
}

// read cost under state-of-the-art approach
function get_R_uniform_strategy(M, T, N, K, Z, B, P, leveltier) {
	  if(leveltier==0){
			K = Math.ceil(T - 1);
			Z = Math.ceil(T - 1);
		}else if(leveltier == 1){
			K = 1;
			Z = 1;
		}else if(leveltier == 2){
			K = Math.ceil(T - 1);
			Z = 1;
		}
    M = M * 8;

		var L = Math.log(N*(T - 1) / (B * P * T)) / Math.log(T);

    if (P * B >= N) {
        return 0;
    }

    if (M <= 0) {
        return K*(L - 1) + Z;
    }

    //double L = !leveled ? floor(1 +  log(N/(B * P)) / log(T)) : ceil(1 +  log(N/(B * P)) / log(T));
    //double L = !leveled ? floor(1 +  log(N/(B * P)) / log(T)) : ceil(1 +  log(N/(B * P)) / log(T));

    var T_part = (1 - Math.pow(T, -L))/( 1 - Math.pow(T, -L-1) );

    var exponent = (M / N) * Math.log(2) * Math.log(2) * T_part;

    var EULER = 2.71828182845904523536;
    var bottom = Math.pow(EULER, exponent);
    var R = 1.0 / bottom;
		if(L < 1){
			return R*Z*L;
		}
    return R*((L - 1)*K + Z);
}


// read cost under MonKey
function get_accurate_R(M, T, N, K, Z, B, P, leveltier) {

	if(leveltier==0){
		K = Math.ceil(T - 1);
		Z = Math.ceil(T - 1);
	}else if(leveltier == 1){
		K = 1;
		Z = 1;
	}else if(leveltier == 2){
		K = Math.ceil(T - 1);
		Z = 1;
	}

	M = M*8;


	var L = Math.log(N*(T - 1)/(B*P*T)+ 1/T)/Math.log(T);
	//var tmpZ = (N - B*P*(Math.pow(T, L-1) - 1/(T-1)))/(B*P*Math.pow(T, L));
	//var Z = tmpZ;
	var Y = calc_Y(M/N, K, Z, T, L);

	if (P * B >= N) {
			return 0;
	}

	if (M <= 0) {
			return K*(L - 1) + Z;
	}

	if(Y <= 0){
		Y = 0;
	}

	var tmp = 1/(Math.pow(T, 1-Y) - Math.pow(T, 1-L));
	var exponent = ((Math.pow(T, 1-Y) - Math.pow(T, 2-L))/(T-1) - (L-Y-1)/Math.pow(T, L-1))*tmp;
	var result = ((T - Math.pow(T, Y-L+1))/(T-1))*K*Math.pow(T, exponent)*Math.pow(Z*1.0/K, tmp*(T - 1.0)/Math.pow(T, Y))*Math.exp(-(M/N)*Math.log(2)*Math.log(2)*tmp*(T - Math.pow(T, -L)))+Y*Z


  return result;
}

//////////////////////////////////////




function smooth(to_print) {
    var num_elimintated = 0;
    for (var i = 2; i < to_print.length; i++) {
        var c1 = to_print[i-2];
        var c2 = to_print[i-1];
        var c3 = to_print[i];
        var rise1 = c2.R - c1.R;
        var run1 = c2.W - c1.W;
        var gradient1 = Math.abs(rise1 / run1);

        var rise2 = c3.R - c1.R;
        var run2 = c3.W - c1.W;
        var gradient2 = Math.abs(rise2 / run2);

        if (gradient1 < gradient2) {
            // to_print.erase(to_print.begin() + i - 1);
            to_print.splice(i - 1,1);
            num_elimintated++;
        }
    }
    return num_elimintated;
}

function print_csv_line(c, num_commas, print_details, differentiate_tiered_leveled) {
    // printf("%.7f, ", c.W);
    var message="";
    message+=((c.W).toFixed(4));

    message+=(", ");



    // if (c.L == 1 && differentiate_tiered_leveled) {
    //  // printf(", ");
    //  message+=(", ");
    // }

    // for (var j = 0; j < num_commas; j++) {
    //  // printf(", ");
    //  message+=(", ");
    //  if (differentiate_tiered_leveled) {
    //      message+=(", ");
    //      // printf(", ");
    //  }
    // }

    // printf("%.4f", c.R);
    message+=" ";
    message+=(  pad((c.R).toFixed(4),7," ")  );

    if (print_details) {
        // printf(",\t%g,\t%g,\t%g,\t%g", c.T, c.P, c.L, c.num_levels);
        var TL=((c.L==0)?"tier":"level");
        var memory_for_level_0=(c.P*c.B*c.E);
        var memory_for_BF=c.M-memory_for_level_0;
        var level_0_size_MB=memory_for_level_0/1024/1024;
        var BF_size_MB=memory_for_BF/1024/1024;
        message+=(",\t"+pad(c.T,4," ")+",\t"+pad(level_0_size_MB.toFixed(2),7," ")+",\t"+pad(TL,5," ")+",\t"+c.num_levels+",\t\t"+(BF_size_MB).toFixed(2));
    }
    console.log(message);
    //document.getElementById("explanationHolistic").value+=(message+"\n");
    // printf("\n");
}




// Iterate through leveling/tiering, size ratio T, and buffer size P to find optimal parameters
function find_optimal_R(input_conf, constant_buffer_size = -1, isOptimalFPR = true) {
    var conf = new LSM_config();
    conf.P=input_conf.P;
    conf.T=input_conf.T;
    conf.L=input_conf.L;
    conf.N=input_conf.N;
    conf.R=input_conf.R;
    conf.W=input_conf.W;
    conf.M=input_conf.M;
    conf.B=input_conf.B;
    conf.E=input_conf.E;
		conf.K=input_conf.K;
		conf.Z=input_conf.Z;
		conf.Y=input_conf.Y;
		conf.mfilter=input_conf.mfilter;
		conf.leveltier=input_conf.leveltier;
		conf.Mu=input_conf.Mu;
    conf.valid=input_conf.valid;
    conf.throughput=input_conf.throughput;
    conf.num_levels=input_conf.num_levels;

    var N = conf.N;
    var B = conf.B;
    var E = conf.E;
    var M = conf.M;
    var W = conf.W;
		var K = conf.K;
		var Z = conf.Z;
		var Y = conf.Y;
		var Mu = conf.Mu;
    conf.valid = false;

    var max_elements_in_buffer = N;

    var starting_buffer_size = 1;
    if (constant_buffer_size > -1) {
        starting_buffer_size = constant_buffer_size / (E * B);
        max_elements_in_buffer = starting_buffer_size * B;
    }

    var min_W = 1;
    var min_R = (1 + Math.log(N/2) / Math.log(2)) * B, best_T = 2, best_P = 1;
    var is_leveled = 1;
    for (var T = 2; T < B * 4; T++) {
        for (var P = starting_buffer_size;  P * B <= max_elements_in_buffer; P *= T) {
            for (var testLeveltier = 0; testLeveltier <= 1; testLeveltier++) {
                var leveled = testLeveltier;
                var num_levels =  Math.ceil(Math.log(N*(T - 1)/ (B * P * T)) / Math.log(T));
                var mem_for_bloom = M - P * B * E;

                var current_R = isOptimalFPR ? get_accurate_R(mem_for_bloom, T, N, K, Z, B, P, testLeveltier) :
                        get_R_uniform_strategy(mem_for_bloom, T, N, K, Z, B, P, testLeveltier);

                var current_W = get_W(mem_for_bloom, N, T, K, Z, B, P, Mu, testLeveltier);
                if (mem_for_bloom >= 0 && current_R < min_R && current_W <= W) {
                    min_R = current_R;
                    best_T = T;
                    best_P = P;
                    min_W = current_W;
                    is_leveled = leveled;
                    conf.W = current_W;
                    conf.valid = true;
                    conf.num_levels = 1 +  Math.log(N*(T - 1)/(B * P * T)) / Math.log(T);
                }
            }
        }
    }
    conf.T = best_T;
    conf.P = best_P;
    conf.leveltier = is_leveled;
    conf.R = min_R;
    return conf;
}




function getPoint(leveltier, T, mfilter, conf, isOptimalFPR) {
                var meetingR;
                if (isOptimalFPR) {
                    meetingR = get_accurate_R(mfilter, T, conf.N, conf.K, conf.Z, conf.B, conf.P, leveltier);
                }
                else {
                    meetingR = get_R_uniform_strategy(mfilter, T, conf.N, conf.K, conf.Z, conf.B, conf.P, leveltier);
                }
                var meetingW = get_W(conf.M-conf.B*conf.P*conf.E, conf.N, T, conf.K, conf.Z, conf.B, conf.P, conf.Mu, leveltier);
                return {W: meetingW, R: meetingR};
}



// Find the corresponding optimal read cost for different upper bounds on write cost
function print_csv_experiment(input_conf, num_commas, print_details, fix_buffer_size = -1, isOptimalFPR = true, smoothing = false, differentiate_tiered_leveled = true) {

    var conf = new LSM_config();
    conf.P=input_conf.P;
    conf.T=input_conf.T;
    conf.L=input_conf.L;
    conf.N=input_conf.N;
    conf.R=input_conf.R;
    conf.W=input_conf.W;
    conf.M=input_conf.M;
    conf.B=input_conf.B;
    conf.E=input_conf.E;
		conf.K=input_conf.K;
		conf.Z=input_conf.Z;
		conf.Y=input_conf.Y;
		conf.mfilter=input_conf.mfilter;
		conf.Mu=input_conf.Mu;

    conf.valid=input_conf.valid;
    conf.throughput=input_conf.throughput;
    conf.num_levels=input_conf.num_levels;

    var prev_W = -1;
    var prev_L = 0;

    var array_to_print = new Array();

    var meeting_W = getPoint(0, 2, conf.mfilter, conf, isOptimalFPR).W;
    var min_W = getPoint(0, 4, conf.mfilter, conf, isOptimalFPR).W;
    var max_W = getPoint(1, 10, conf.mfilter, conf, isOptimalFPR).W;

    var starting_W = min_W * 0.1;
    var finishing_W = max_W * 10;
    var steps_for_leveling = (finishing_W - meeting_W) / 200;

    //print_write_optimized_extreme(conf, use_new_strategy);
    // console.log(input_conf)
    // console.log(conf)

    var last_c = LSM_config();
    for (var W = starting_W; W <= finishing_W; W += 0.001) {
        conf.W = W;

        var c = find_optimal_R(conf, fix_buffer_size, isOptimalFPR);
        // console.log(c)
        // print_csv_line(c,num_commas,print_details,differentiate_tiered_leveled);

        // document.getElementById("explanation").value += (c.W.toFixed(4) + "\t\t" + c.R.toFixed(2) + "\t\t" + c.L + "\t\t" + c.T + "\t\t" + c.valid + "\n");

        // return;

        if ((prev_W == c.W && prev_L == c.L) || !c.valid) {
            continue;
        }
        prev_W = c.W;
        prev_L = c.leveltier;

        /*if (c.L == 1 && last_c.L == 0 && last_c.T == 2 && differentiate_tiered_leveled) {
            last_c.L = 1;
            array_to_print.push(last_c);
            //print_csv_line(last_c, num_commas, print_details);
        }*/

        array_to_print.push(c);
        //print_csv_line(c, num_commas, print_details);

        last_c = c;

        if (W >= meeting_W) {
            W += steps_for_leveling;
        }
    }

    var num_eliminated = 1;
    while (smoothing && num_eliminated > 0) {
        num_eliminated = smooth(array_to_print);
        //printf("%d   \n", num_eliminated);
    }

    // console.log(array_to_print)
    return (array_to_print);

    // console.log("printing "+array_to_print.length+" rows")

    // document.getElementById("explanation").value+=("Printing the "+array_to_print.length+ " configurations on the performance skyline.\n");
    // document.getElementById("explanation").value+=("write,\tread,\tT,\tL0 (MB),  merge,  levels,\tBF (MB)\n");

    // document.getElementById("explanation").value+="array size " + array_to_print.length;

    // for (var i = 0; i < array_to_print.length; i++) {
    //     print_csv_line(array_to_print[i], num_commas, print_details, differentiate_tiered_leveled);
    // }

    // printf("\n");
}

function getLSMConfig(){
	var inputParameters = parseInputTextBoxes();

	var N=inputParameters.N;
	var E=inputParameters.E;
	var mbuffer=inputParameters.mbuffer;
	var T=inputParameters.T;
	var K=inputParameters.fluidK;
	var Z=inputParameters.fluidZ;
	var Mu=inputParameters.Mu;
	var mfilter_per_entry=inputParameters.mfilter_per_entry;
	var mfilter = mfilter_per_entry*N/8;
	var P=inputParameters.P;
	var leveltier=inputParameters.leveltier;
	var isOptimalFPR=inputParameters.isOptimalFPR;
	var key_size=inputParameters.key_size;


	var conf = new LSM_config();
	conf.T=T;
	conf.L=Math.ceil(Math.log(N*E*(T - 1)/mbuffer/T+ 1/T)/Math.log(T));
	conf.P=mbuffer / P;
	conf.N=N;
	conf.M=mbuffer+mfilter;
	conf.mfilter=mfilter;
	conf.mbuffer=mbuffer;
	conf.E=E;
	conf.key_size=key_size;
	conf.B=P/E;
	conf.K=K;
	conf.Z=Z;
	conf.Mu=Mu;
	conf.leveltier=leveltier;
	conf.Y=calc_Y(mfilter/N, K, Z, T, L);
	conf.s=inputParameters.s
	conf.w=inputParameters.w;
	conf.v=inputParameters.v;
	conf.r=inputParameters.r;
	conf.qL=inputParameters.qL;
	conf.qS=inputParameters.qS;
	conf.isOptimalFPR=isOptimalFPR;
	return conf;
}

function AutoTune1(e){
	var conf = getLSMConfig();
	var optimal_conf;
	if(conf.leveltier != 5){
		optimal_conf = AutoTuneL(conf, [conf.leveltier]);
		document.getElementById("T").value=optimal_conf[1][optimal_conf[1].length-1];
		e.target.id="T";
	}else{
		optimal_conf = AutoTuneL_LSM_Bush(conf);
		document.getElementById("L").value=optimal_conf[1][0];
		e.target.id="L";
	}

	/*
	var startT = optimal_conf[1][optimal_conf[1].length-1];
	var Tmax = 4* conf.P/conf.E;
	var tmp_optimal_conf=AutoTune_GD_test(0, Math.max(conf.K, conf.Z)+1, Tmax, conf, startT);
	console.log(tmp_optimal_conf);
	if(tmp_optimal_conf[0] < optimal_conf[0]){
		optimal_conf = tmp_optimal_conf;
	}*/


	re_run(e);
	clickbloomTuningButton(true)
}

function AutoTune2(e){
	var conf = getLSMConfig();
	var optimal_conf = AutoTuneL(conf, [0, 1, 2]);
	//var Tmax = 4* inputParameters.P/inputParameters.E;
	//AutoTuneT(2, Tmax, inputParameters);
	/*
	var tree_type=optimal_conf[1][0].leveltier;
	var startT = optimal_conf[1][optimal_conf[1].length-1];
	var Tmax = 4* conf.P/conf.E;
	var tmp_optimal_conf=AutoTune_GD_test(0, Math.max(conf.K, conf.Z)+1, Tmax, optimal_conf[1][0], startT);
	console.log(tmp_optimal_conf);
	if(tmp_optimal_conf[0] < optimal_conf[0]){
		optimal_conf = tmp_optimal_conf;
	}
	*/
	document.getElementById("input-group-Fluid-K").style.display = 'none';
document.getElementById("input-group-Fluid-Z").style.display = 'none';
	tmp_optimal_conf = AutoTuneL_LSM_Bush(conf);
	var lsh_table_cost = getHashTableCost(conf);
	if(lsh_table_cost < tmp_optimal_conf[0] && lsh_table_cost < optimal_conf[0]){

		document.getElementById("merge configuration content").style.display="none";
    document.getElementById("merge configuration text").style.display="none";
		document.getElementById("lsh-table memory").style.display="";
		document.getElementById("lsm-tree/bush memory").style.display="none";
		document.getElementById("lsm-tree/bush fpr").style.display="none";
		document.getElementById("lsm-tree/bush fence-pointer memory").style.display="none";
		document.getElementById("lsh_table_gc_threshold").value=0.5;

		reset_button_colors();
		document.getElementById("Build").onclick = function(){
			clickbloomTuningButton(false, true);
		}
    clickbloomTuningButton(true, true);
		document.getElementById("scenario1").style.background='#000000';

	}else{
		if(tmp_optimal_conf[0] < optimal_conf[0]){
			tree_type = 5;
			document.getElementById("input-group-LL-Bush-K").value = 2;
			document.getElementById("LL-Bush T").readOnly=true;
			document.getElementById("L").value = tmp_optimal_conf[1][0];
			document.getElementById("LL-Bush T").value = tmp_optimal_conf[1][1];
			MergeByLSMBush();
			reset_button_colors()
			document.getElementById("scenario2").style.background='#000000';
			e.target.id="L";
		}else{
			tree_type = optimal_conf[1][0].leveltier;
			document.getElementById("T").value=optimal_conf[1][optimal_conf[1].length-1];
			MergeNotyFliudLSMTree();
			e.target.id="T";
			reset_button_colors()
			document.getElementById("scenario3").style.background='#000000';
		}

		var radios = document.getElementsByName("ltradio");
		for(var i = 0; i < radios.length; i++){
			if(radios[i].value==tree_type){
				radios[i].checked=true;
			}else{
				radios[i].checked=false;
			}

		}


		re_run(e);
		clickbloomTuningButton(true)
	}

}
function AutoTune3(e){
	var conf = getLSMConfig();
	var Tmax=4* conf.P/conf.E;
	conf.leveltier = 3;
	var optimal_conf = AutoTuneL(conf, [3]);
	var startT = optimal_conf[1][optimal_conf[1].length-1];
	var Tmax = 4* conf.P/conf.E;
	var tmp_optimal_conf=AutoTune_GD_test(0, 2, Tmax, optimal_conf[1][0], startT, true);
	console.log(tmp_optimal_conf);
	if(tmp_optimal_conf[0] < optimal_conf[0]){
		optimal_conf = tmp_optimal_conf;
	}
	document.getElementById("input-group-Fluid-K").style.display = '';
	document.getElementById("input-group-Fluid-Z").style.display = '';
	var radios = document.getElementsByName("ltradio");
	for(var i = 0; i < radios.length; i++){
		if(radios[i].value==3){
			radios[i].checked=true;
		}else{
			radios[i].checked=false;
		}

	}
	document.getElementById("T").value=Math.round(optimal_conf[1][optimal_conf[1].length-1]);
	document.getElementById("Fluid LSM-Tree K").value=Math.min(Math.round(optimal_conf[1][0].K), document.getElementById("T").value - 1);
	document.getElementById("Fluid LSM-Tree Z").value=Math.min(Math.round(optimal_conf[1][0].Z), document.getElementById("T").value - 1);
	e.target.id="T";
	re_run(e);
	clickbloomTuningButton(true)
}

function MergeByFliudLSMTree(){
	document.getElementById("L").readOnly=false;
	document.getElementById("X").value = numberWithCommas(0);
document.getElementById("input-group-T").style.display = '';
	document.getElementById("input-group-Fluid-K").style.display = '';
	document.getElementById("input-group-Fluid-Z").style.display = '';
	var T = document.getElementById("T").value;
	if(lastTreeType == 1){
		document.getElementById("Fluid LSM-Tree K").value = 1;
		document.getElementById("Fluid LSM-Tree Z").value = 1;
	}else if(lastTreeType == 0){
		document.getElementById("Fluid LSM-Tree K").value = Math.ceil(T - 1);
		document.getElementById("Fluid LSM-Tree Z").value = Math.ceil(T - 1);
	}else if(lastTreeType == 2){
		document.getElementById("Fluid LSM-Tree K").value = Math.ceil(T - 1);
		document.getElementById("Fluid LSM-Tree Z").value = 1;
	}
	document.getElementById("input-group-LL-Bush-K").style.display = 'none';
	document.getElementById("input-group-LL-Bush-T").style.display = 'none';
	document.getElementById("input-group-LL-Bush-Updates").style.display = 'none';
	re_run(event, 'input7');
}

function MergeNotyFliudLSMTree(){
	draw_lsm_graph("lsm_tree");
}

function MergeByLLBush(){
	document.getElementById("lsm_bush_L").readOnly=true;
	document.getElementById("lsm_bush_T").readOnly=true;
	event.target.id="N";
	//event.target.id="N";
	re_run(event, 'input7');

}

function MergeByLSMBush(){
	document.getElementById("lsm_bush_L").readOnly=false;
	document.getElementById("lsm_bush_T").readOnly=true;
	re_run(event, 'input7');
}

function MergeBy3LBush(){
	document.getElementById("lsm_bush_L").value = 3;
	document.getElementById("lsm_bush_L").readOnly=true;
	document.getElementById("lsm_bush_T").readOnly=true;
	re_run(event, 'input7');
}

function showStorageDevice(){
	document.getElementById('storage-device-trigger').onclick=function(){hideStorageDevice();}
	document.getElementById("storage-device-setting").style.display='';
}

function hideStorageDevice(){
	document.getElementById('storage-device-trigger').onclick=function(){showStorageDevice();}
	document.getElementById("storage-device-setting").style.display='none';

}

function showDataset(){
	document.getElementById('dataset-trigger').onclick=function(){hideDataset();}
	document.getElementById("dataset-setting").style.display='';

}

function hideDataset(){
	document.getElementById('dataset-trigger').onclick=function(){showDataset();}
	document.getElementById("dataset-setting").style.display='none';
}

function showWorkload(){
	document.getElementById('workload-trigger').onclick=function(){hideWorkload();}
	document.getElementById("workload-setting").style.display='';
}

function hideWorkload(){
	document.getElementById('workload-trigger').onclick=function(){showWorkload();}
	document.getElementById("workload-setting").style.display='none';
}
