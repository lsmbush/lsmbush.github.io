var timer=null;

function update_lsm_bush(lsm_bush_type, lsm_bush_L, lsm_bush_T, lsm_bush_K, lsm_bush_mbuffer, N, E){
  if(lsm_bush_type == 4){
      var L = getLLBushL(N, E, lsm_bush_mbuffer, lsm_bush_K, 2);
      var lsm_bush_T = getLLBushAccurateT(L, N, E, lsm_bush_mbuffer, lsm_bush_K);
      while(lsm_bush_T < 2){
        L -= 1;
        if(L < 3){
          L += 1;
          break;
        }
        lsm_bush_T = getLLBushAccurateT(L, N, E, lsm_bush_mbuffer, lsm_bush_K);
      }
      document.getElementById("lsm_bush_L").value = L;
      document.getElementById("lsm_bush_T").value = lsm_bush_T;
  }else if(lsm_bush_type == 5){
      var L = lsm_bush_L;
      var maxL = Math.ceil(Math.log(Math.log(N*E/lsm_bush_mbuffer)/Math.log(2))/Math.log(2));
      if(L > maxL){
        document.getElementById("lsm_bush_L").value = maxL;
        alert("L="+L+" is larger than the maximum L="+maxL+" in LSM-bush.")
        console.log("L="+L+" is larger than the maximum L="+maxL+" in LSM-bush.");
        L = maxL;
      }

      var lsm_bush_T = getLLBushAccurateT(L, N, E, lsm_bush_mbuffer, lsm_bush_K);
      document.getElementById("lsm_bush_T").value = Math.max(lsm_bush_T, 2);

  }else if(lsm_bush_type == 6){
    var L = 3;
    var lsm_bush_T = getLLBushAccurateT(3, N, E, lsm_bush_mbuffer, lsm_bush_K);
    document.getElementById("lsm_bush_T").value = Math.max(lsm_bush_T, 2);
  }
  draw_lsm_graph("lsm_bush");
}

function update_lsm_tree(lsm_tree_type, lsm_tree_L, lsm_tree_T, lsm_tree_mbuffer, N, E){
  var L = Math.ceil(Math.log(N*E*(lsm_tree_T - 1)/lsm_tree_mbuffer/lsm_tree_T + 1/lsm_tree_T)/Math.log(lsm_tree_T));
  if(L <= 0){
    L = 0;
  }
  document.getElementById("lsm_tree_L").value=L;
  	draw_lsm_graph("lsm_tree");
}

function re_run(e) {
    if(timer){
        clearTimeout(timer);
        timer = null;
    }

    var event = e || event;
    // console.log(event)

    var x = event.which || event.keyCode;  // Use either which or keyCode, depending on browser support
    // console.log(event.timeStamp)
    // console.log(x)

    if (!((x==38 || x==40) && (event.target.id=="E" || event.target.id=="mbuffer" || event.target.id=="P" || event.target.id=="T")))
    {
	    if (x>=37 && x<=40 || x==9 || x==16 || x==17 || x==91 || x==18 || x==65)
	    {
	        // if (event.target.id=="N" || event.target.id=="mfilter")
	        console.log("User is clicking ["+x+"] on arrows or tab (9) or shift (16) or ctrl (17) or cmd (91) or alt (18). No rerun.")
	        return;
	    }
	}

    if(event.target.id.endsWith("mfilter_per_entry"))
    {
        var mfilter_per_entry = parseFloat(document.getElementById(event.target.id).value);
        if(!isNaN(mfilter_per_entry)){
        document.getElementById(event.target.id).value=mfilter_per_entry
      }else{
        document.getElementById(event.target.id).value="";
      }
        // console.log(numberWithCommas(N))
    }

    var N = parseInt(document.getElementById("N").value.replace(/\D/g,''),10);
    var P = parseInt(document.getElementById("P").value.replace(/\D/g,''),10);
    document.getElementById("N").value=numberWithCommas(N)
    var E = parseInt(document.getElementById("E").value.replace(/\D/g,''),10);
    var w=parseFloat(document.getElementById("w").value);
    var r=parseFloat(document.getElementById("r").value);
    var v=parseFloat(document.getElementById("v").value);
    var qL=parseFloat(document.getElementById("qL").value);
    var qS=parseFloat(document.getElementById("qS").value);

    if(event.target.id == "Key-Size"){
      var key_size = document.getElementById("Key-Size").value;
      if(isNaN(key_size)){
        alert("Key_Size="+key_size+" is not a valid number.")
        console.log("Key Size is not a valid number: "+key_size)
        document.getElementById("Key-Size").value=E/2;
      }else if(key_size <= 0 || key_size >= E){
        alert("Key_Size="+key_size+" should be in the range of (0, " + E + ").")
        console.log("Key Size should be in the range of (0, " + E + ") :"+key_size)
        document.getElementById("Key-Size").value=E/2;
      }else{
        document.getElementById("mhash_table_per_entry").value=key_size*8;
        document.getElementById("lsm_bush_mfence_pointer_per_entry").value=key_size/(P/E)*8;
        document.getElementById("lsm_tree_mfence_pointer_per_entry").value=key_size/(P/E)*8;
      }
    }

    //lsh-Table
    var lsh_table_mbuffer = document.getElementById("lsh_table_mbuffer").value;
    if(isNaN(lsh_table_mbuffer)){
      alert("LSH-Table buffer="+lsh_table_mbuffer+" MB is invalid.")
      console.log("LSH-Table buffer is invalid: "+lsh_table_mbuffer);
      document.getElementById("lsh_table_mbuffer") = 2;
      lsh_table_mbuffer = 2;
    }
    lsh_table_mbuffer = parseFloat(lsh_table_mbuffer);
    if (lsh_table_mbuffer<0){
        alert("Buffer="+lsh_table_mbuffer+" is too small in LSH-Table.");
        document.getElementById("lsh_table_mbuffer") = 2;
        lsh_table_mbuffer = 2;
    }
    lsh_table_mbuffer *= 1048576;
    var hash_table_gc_threshold =document.getElementById("lsh_table_gc_threshold").value;
    if(isNaN(hash_table_gc_threshold)){

      alert("GC Threshold="+hash_table_gc_threshol+" is invalid.");
      console.log("The threshold ratio of garbage collection is invalid: "+hash_table_gc_threshold);
      document.getElementById("lsh_table_gc_threshold").value = 0.5;
      hash_table_gc_threshold = 0.5;
    }
    hash_table_gc_threshold = parseFloat(hash_table_gc_threshold);
    if (hash_table_gc_threshold<=0 || hash_table_gc_threshold >= 1){
        alert("GC Threshold="+hash_table_gc_threshold+" should be in the range (0, 1).");
        document.getElementById("lsh_table_gc_threshold").value = 0.5;
        hash_table_gc_threshold = 0.5;
    }
    scenario1();

    // lsm tree
    var L = parseInt(document.getElementById("lsm_tree_L").value);
    var lsm_tree_mbuffer = document.getElementById("lsm_tree_mbuffer").value;
    if(isNaN(lsm_tree_mbuffer)){
      alert("LSM-Tree buffer="+lsm_tree_mbuffer+" MB is invalid.")
      console.log("LSM-Tree buffer is invalid: "+lsm_tree_mbuffer);
      document.getElementById("lsm_tree_mbuffer").value = 2;
      lsm_tree_mbuffer = 2;
    }
    lsm_tree_mbuffer = parseFloat(lsm_tree_mbuffer);
    if (lsm_tree_mbuffer<0){

        alert("Buffer="+lsm_tree_mbuffer+" is too small in LSM-Tree.");
        document.getElementById("lsm_tree_mbuffer").value = 2;
        lsm_tree_mbuffer = 2;
    }
    lsm_tree_mbuffer *= 1048576;

    var lsm_tree_T = document.getElementById("lsm_tree_T").value;
    if(isNaN(lsm_tree_T)){
      alert("LSM-Tree T="+lsm_tree_T+" is invalid.")
      console.log("LSM-Tree T is invalid: "+lsm_tree_T);
      lsm_tree_T = calc_T(N, lsm_tree_mbuffer*1024*1024, E, L, 10000001);
      document.getElementById("lsm_tree_T").value = lsm_tree_T;
    }
    lsm_tree_T = parseFloat(lsm_tree_T);
    if (lsm_tree_T<2){
      alert("T="+lsm_tree_T+" is too small.")
      console.log("T in LSM-Tree is too small: "+lsm_tree_T);
      lsm_tree_T = 2;
      document.getElementById("lsm_tree_T").value = lsm_tree_T;
    }
    var lsm_tree_type=getRadioValueByName("lsm_tree_type");
    update_lsm_tree(lsm_tree_type, lsm_tree_L, lsm_tree_T, lsm_tree_mbuffer, N, E);


    // lsm bush
    var lsm_bush_T = parseFloat(document.getElementById("lsm_bush_T").value);
    var lsm_bush_mbuffer = document.getElementById("lsm_bush_mbuffer").value;
    if(isNaN(lsm_bush_mbuffer)){
      alert("LSM-Tree buffer="+lsm_bush_mbuffer+" MB is invalid.")
      console.log("LSM-Bush buffer is invalid: "+lsm_bush_mbuffer);
      document.getElementById("lsm_bush_mbuffer").value = 2;
      lsm_bush_mbuffer = 2;
    }
    lsm_bush_mbuffer = parseFloat(lsm_bush_mbuffer);
    if (lsm_bush_mbuffer<0){
        alert("Buffer="+lsm_bush_mbuffer+" is too small in LSM-Bush.");
        document.getElementById("lsm_bush_mbuffer").value = 2;
        lsm_bush_mbuffer = 2;
    }
    lsm_bush_mbuffer *= 1048576;

    var lsm_bush_K=document.getElementById("lsm_bush_K").value;
    if(isNaN(lsm_bush_K)){
      alert("LSM-Bush K="+lsm_bush_K+" is invalid.")
      console.log("LSM-Bush K is invalid: "+lsm_bush_K);
      document.getElementById("lsm_bush_K").value = 2;
      lsm_bush_K = 2;
    }

    var lsm_bush_L = document.getElementById("lsm_bush_L").value;
    if(isNaN(lsm_bush_L)){
      alert("LSM-Bush Level="+lsm_bush_L+" is invalid.")
      console.log("LSM-Bush Level is invalid: "+Level);
      lsm_bush_L = getLLBushL(N, E, lsm_bush_mbuffer, lsm_bush_K, lsm_bush_T);
      document.getElementById("lsm_bush_L").value = lsm_bush_L;
    }
    lsm_bush_L = parseInt(lsm_bush_L);
    if(lsm_bush_L < 3){
      alert("LSN-Bush Level="+lsm_bush_L+" is too small.")
      console.log("Level in LSM-Bush is too small: "+lsm_bush_L)
      document.getElementById("lsm_bush_L").value=3;
      lsm_bush_L = 3;
    }


    var lsm_bush_type = getRadioValueByName("lsm_bush_type");

    update_lsm_bush(lsm_bush_type, lsm_bush_L, lsm_bush_T, lsm_bush_K, lsm_bush_mbuffer, N, E);


    timer=setTimeout(re_run_now,250);

}


function re_run_now() {

    var inputParameters = parseInputTextBoxes();

    var N=inputParameters.N;
    var E=inputParameters.E;
    var P=inputParameters.P;

    var read_latency=inputParameters.read_latency;
    var write_latency=inputParameters.write_latency;
    var s=inputParameters.s;
    var w=inputParameters.w;
    var r=inputParameters.r;
    var v=inputParameters.v;
    var qL=inputParameters.qL;
    var qS=inputParameters.qS;

    if (!isNaN(N))
        document.getElementById("N").value=numberWithCommas(N);
    if (!isNaN(E))
        document.getElementById("E").value=E;
    if (!isNaN(P))
        document.getElementById("P").value=P;
    if (!isNaN(read_latency))
        document.getElementById("read-latency").value=read_latency;
    if (!isNaN(write_latency))
        document.getElementById("write-latency").value=write_latency;
    if (!isNaN(s))
        document.getElementById("s").value=s;
    if (!isNaN(w)){
      document.getElementById("w").value=w;
    }else{
      document.getElementById("w").value=1;
    }

    if (!isNaN(r)){
      document.getElementById("r").value=r;
    }else{
      document.getElementById("r").value=1;
    }

    if (!isNaN(v)){
      document.getElementById("v").value=v;
    }else{
      document.getElementById("v").value=1;
    }

    if (!isNaN(qL)){
      document.getElementById("qL").value=qL;
    }else{
      document.getElementById("qL").value=1;
    }

    if (!isNaN(qS)){
      document.getElementById("qS").value=qS;
    }else{
      document.getElementById("qS").value=1;
    }


    if(N >= Number.MAX_SAFE_INTEGER){
      alert("Too large N can't be supported!");
      document.getElementById("N").value=68719476736;
      return;
    }


    //clickbloomTuningButton(false)

}
