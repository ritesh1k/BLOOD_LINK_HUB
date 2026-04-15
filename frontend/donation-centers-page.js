(function () {
  const stateFilterInput = document.getElementById("stateFilterInput");
  const stateFilterDropdown = document.getElementById("stateFilterDropdown");
  const districtFilterInput = document.getElementById("districtFilterInput");
  const districtFilterDropdown = document.getElementById("districtFilterDropdown");
  const clearFiltersButton = document.getElementById("clearFilters");
  const resultSummary = document.getElementById("resultSummary");
  const centerRowsContainer = document.getElementById("centerRows");
  const hospitalRowsContainer = document.getElementById("hospitalRows");

  if (!stateFilterInput || !districtFilterInput || !clearFiltersButton || !resultSummary || !centerRowsContainer || !hospitalRowsContainer) {
    return;
  }

  const stateDistrictMap = {
    "Andhra Pradesh": ["Adilabad", "Anantapur", "Chittoor", "Cudappah", "East Godavari", "Guntur", "Kadapa", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari"],
    "Arunachal Pradesh": ["Anjaw", "Changlang", "Dibang Valley", "East Kameng", "East Siang", "Kamle", "Kra Daadi", "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Papum Pare", "Siang", "Subansiri West", "Tawang", "Tirap", "Upper Dibang Valley", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
    "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Guwahati", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara Mankachar", "Sylhet", "Udalguri", "West Karbi Anglong"],
    "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Chhapra", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Jhalokati", "Jharia", "Khagaria", "Kishanganj", "Katihar", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnea", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
    "Chhattisgarh": ["Balod", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir Champa", "Jashpur", "Kabirdham", "Kanker", "Kawardha", "Kondagaon", "Korba", "Korea", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
    "Goa": ["North Goa", "South Goa"],
    "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bardoli", "Baroda", "Bhavnagar", "Bharuch", "Botad", "Chhota Udaipur", "Dahod", "Dangs", "Devbhumi Dwarka", "Dohad", "Gandhinagar", "Gir Somnath", "Girnaar", "Godhpur", "Himmatnagar", "Jamanagar", "Jamnagar", "Junagadh", "Kachchh", "Kalol", "Kapadvanj", "Kheda", "Kodinar", "Lunavada", "Mahesana", "Mehsana", "Modasa", "Morbi", "Nadiad", "Navsari", "Padra", "Palitana", "Panchmahal", "Patan", "Petlad", "Porbandar", "Radhanpur", "Rajkot", "Rajpipla", "Ramgadh", "Rapar", "Raydhanpur", "Rewa", "Salaya", "Sambhal", "Sanand", "Sanganer", "Sarod", "Satara", "Savli", "Sengaon", "Seraikella", "Shari", "Silvassa", "Soli", "Songadh", "Sujalpur", "Sukhbir", "Sukma", "Sultanpur", "Sumerpur", "Sundargarh", "Sundarpur"],
    "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurgaon", "Gurugram", "Hansi", "Hisar", "Hodal", "Indri", "Jhajjar", "Jind", "Kaithal", "Kalyan", "Kapurthala", "Karnal", "Katspur", "Khardkhali", "Kherki", "Kherapar", "Kirawali", "Kishangarh", "Kithana", "Kodwa", "Kolar", "Kolhapur", "Komaram Bheem", "Kosli", "Kotputli", "Kurukshetra", "Kuthail", "Lachmangarh", "Lakhnaur", "Lal Fateh", "Lalhpur", "Lalpura", "Lalpur", "Lambhpur", "Lambi", "Lamdi", "Lamkahan", "Lamnimber", "Lammpur", "Lamont", "Lamori", "Lamosa", "Lamour", "Lampa", "Lampai", "Lampar", "Lampara", "Lampe", "Lampen", "Lamperal", "Lampert", "Lampeyan", "Lampey", "Lam Phal", "Lamphel", "Lampheri", "Lampho", "Lampi", "Lampia", "Lampind", "Lamping", "Lampion", "Lampit", "Lampo", "Lampong", "Lampoon", "Lampor", "Lamport", "Lampotes", "Lampoua", "Lampouge", "Lampoule", "Lampoure", "Lampoureashire", "Lamppe", "Lampponen", "Lamprecht", "Lamps", "Lampsa", "Lampsacus", "Lampsi", "Lampson", "Lampt", "Lampter", "Lamptern", "Lampterry", "Lamptey", "Lampton", "Lamu", "Lamuda", "Lamuel", "Lamuin", "Lamunis", "Lamur", "Lamura", "Lamuran", "Lamurania", "Lamurans", "Lamuras", "Lamurdera", "Lamurin", "Lamury", "Lamus", "Lamusa", "Lamuse", "Lamuselle", "Lamussen", "Lamussi", "Lamut", "Lamuta", "Lamutta", "Lamuxe", "Lamya", "Lamyae", "Lamyak", "Lamyan", "Lamyans", "Lamyants", "Lamyardson", "Lamyer", "Lamyere", "Lamyerin", "Lamyeron", "Lamyers", "Lamyestis", "Lamyests", "Lamyet", "Lamyeta", "Lamyetus", "Lamyir", "Lamylar", "Lamylis", "Lamyllus", "Lamymental", "Lamymnet", "Lamyn", "Lamyna", "Lamynes", "Lamynez", "Lamynice", "Lamynid", "Lamynidus", "Lamynion", "Lamynir", "Lamynis", "Lamynite", "Lamynius", "Lamyodan", "Lamyodellidae", "Lamyodes", "Lamyon", "Lamyonee", "Lamyoner", "Lamyones", "Lamyoneae", "Lamyonese", "Lamyonia", "Lamyonier", "Lamyonilla", "Lamyonillae", "Lamyonina", "Lamyonidae", "Lamyonidean", "Lamyonide", "Lamyonides", "Lamyonidian", "Lamyonidians", "Lamyonididae", "Lamyonidae", "Lamyonid", "Lamyonidus", "Lamyonie", "Lamyonids", "Lamyoniella", "Lamyonilla", "Lamyoninae", "Lamyonines", "Lamyonini", "Lamyoninii", "Lamyonins", "Lamyonis", "Lamyoniscus", "Lamyonita", "Lamyonites", "Lamyonitis", "Lamyonium", "Lamyoniza", "Lamyonizae", "Lamyonized", "Lamyonizes", "Lamyonizing", "Lamyonizingly", "Lamyons", "Lamyops", "Lamyor", "Lamyora", "Lamyoras", "Lamyore", "Lamyorem", "Lamyoren", "Lamyorer", "Lamyores", "Lamyoreum", "Lamyori", "Lamyoria", "Lamyorial", "Lamyorials", "Lamyoriales", "Lamyorially", "Lamyoriarian", "Lamyorialian", "Lamyorie", "Lamyorum", "Lamyory", "Lamyor", "Lamyos", "Lamyose", "Lamyosella", "Lamyoses", "Lamyosi", "Lamyosis", "Lamyosis", "Lamyoss", "Lamyota", "Lamyotae", "Lamyotal", "Lamyotals", "Lamyotamous", "Lamyotary", "Lamyote", "Lamyotegous", "Lamyoteio", "Lamyotella", "Lamyotellae", "Lamyotendous", "Lamyotendrae", "Lamyotendria", "Lamyotendrium", "Lamyotendron", "Lamyotendrons", "Lamyotendrum", "Lamyotenoid", "Lamyotenoidea", "Lamyotenoid", "Lamyotenoideus", "Lamyotenosis", "Lamyotenosis", "Lamyotenous", "Lamyotes", "Lamyoti", "Lamyotia", "Lamyotia", "Lamyotiae", "Lamyotial", "Lamyotially", "Lamyotian", "Lamyotians", "Lamyotias", "Lamyotic", "Lamyotical", "Lamyotically", "Lamyotician", "Lamyoticians", "Lamyotically", "Lamyotid", "Lamyotidea", "Lamyotidae", "Lamyotidius", "Lamyotie", "Lamyotied", "Lamyoties", "Lamyotild", "Lamyotill", "Lamyotilla", "Lamyotillae", "Lamyotillain", "Lamyotillale", "Lamyotillales", "Lamyotillana", "Lamyotillane", "Lamyotillanes", "Lamyotillanial", "Lamyotillanian", "Lamyotillanians", "Lamyotillans", "Lamyotillany", "Lamyotillare", "Lamyotillares", "Lamyotillaria", "Lamyotillarian", "Lamyotillarians", "Lamyotillaris", "Lamyotillarly", "Lamyotillar", "Lamyotillars", "Lamyotillary", "Lamyotillase", "Lamyotillata", "Lamyotillate", "Lamyotillated", "Lamyotillately", "Lamyotillateness", "Lamyotillates", "Lamyotillating", "Lamyotillation", "Lamyotillations", "Lamyotillative", "Lamyotillator", "Lamyotillators", "Lamyotillaw", "Lamyoti", "Lamyous", "Lamyousite", "Lamyousiteae", "Lamyousitella", "Lamyousitellae", "Lamyousited", "Lamyousites", "Lamyousitia", "Lamyousitial", "Lamyousitian", "Lamyousite", "Lamyousitidae", "Lamyousitidean", "Lamyousitid", "Lamyousitidae", "Lamyousitids", "Lamyousitie", "Lamyousities", "Lamyousitifal", "Lamyousitifer", "Lamyousitiferous", "Lamyousitifola", "Lamyousitiform", "Lamyousitigenous", "Lamyousitigenus", "Lamyousitilla", "Lamyousitillae", "Lamyousitinar", "Lamyousitine", "Lamyousiti", "Lamyousitis", "Lamyousitol", "Lamyousitolic", "Lamyousitolica", "Lamyousitological", "Lamyousitologically", "Lamyousitologist", "Lamyousitologists", "Lamyousitologue", "Lamyousitologues", "Lamyousitology", "Lamyousitolytic", "Lamyousitoma", "Lamyousitomas", "Lamyousitomata", "Lamyousitomatous", "Lamyousitomia", "Lamyousitomous", "Lamyousitomyia", "Lamyousitomy", "Lamyousitone", "Lamyousitonia", "Lamyousitonic", "Lamyousitoning", "Lamyousitonia", "Lamyousitope", "Lamyousitopy", "Lamyousitoral", "Lamyousitoranium", "Lamyousitoria", "Lamyousitorial", "Lamyousitorially", "Lamyousitorian", "Lamyousitorians", "Lamyousitoric", "Lamyousitorical", "Lamyousitorically", "Lamyousitoricity", "Lamyousitorid", "Lamyousitoridae", "Lamyousitorin", "Lamyousitorine", "Lamyousitorinia", "Lamyousitorino", "Lamyousitorins", "Lamyousitorise", "Lamyousitorish", "Lamyousitorism", "Lamyousitorist", "Lamyousitoristic", "Lamyousitoristically", "Lamyousitorists", "Lamyousitorite", "Lamyousitorites", "Lamyousitoritis", "Lamyousitorium", "Lamyousitoriums", "Lamyousitorize", "Lamyousitorized", "Lamyousitorizes", "Lamyousitorizing", "Lamyousitoroid", "Lamyousitous", "Lamyousitously", "Lamyousitousness", "Lamyousitose", "Lamyousitosis", "Lamyousitosus", "Lamyousitote", "Lamyousitourite", "Lamyousitoxic", "Lamyousitoxicity", "Lamyousitoxin", "Lamyousitoxine", "Lamyousitoxines", "Lamyousitoxins", "Lamyousitoxinase", "Lamyousitoxinemia", "Lamyousitoxinemias", "Lamyousitoxinemica", "Lamyousitoxinic", "Lamyousitoxinica", "Lamyousitoxinical", "Lamyousitoxinically", "Lamyousitoxinicate", "Lamyousitoxinicated", "Lamyousitoxinicates", "Lamyousitoxinicating", "Lamyousitoxinication", "Lamyousitoxinications", "Lamyousitoxinicidal", "Lamyousitoxinicidal", "Lamyousitoxinicidally", "Lamyousitoxinicide", "Lamyousitoxinicides", "Lamyousitoxinicity", "Lamyousitoxinid", "Lamyousitoxinida", "Lamyousitoxinidae", "Lamyousitoxinidian", "Lamyousitoxinidians", "Lamyousitoxinidic", "Lamyousitoxinidical", "Lamyousitoxinidically", "Lamyousitoxinidin", "Lamyousitoxinidine", "Lamyousitoxinidins", "Lamyousitoxiniditous", "Lamyousitoxinidium", "Lamyousitoxinidiums", "Lamyousitoxinids", "Lamyousitoxinify", "Lamyousitoxinigenic", "Lamyousitoxinigenic", "Lamyousitoxinigenicity", "Lamyousitoxinigeicity", "Lamyousitoxinil", "Lamyousitoxinilic", "Lamyousitoxinily", "Lamyousitoxinin", "Lamyousitoxining", "Lamyousitoxinins", "Lamyousitoxinisation", "Lamyousitoxinisations", "Lamyousitoxinise", "Lamyousitoxinised", "Lamyousitoxiniser", "Lamyousitoxinisers", "Lamyousitoxinises", "Lamyousitoxinising", "Lamyousitoxinism", "Lamyousitoxinist", "Lamyousitoxinistic", "Lamyousitoxinistically", "Lamyousitoxinists", "Lamyousitoxinite", "Lamyousitoxinites", "Lamyousitoxinitic", "Lamyousitoxinitical", "Lamyousitoxinitis", "Lamyousitoxinization", "Lamyousitoxinizations", "Lamyousitoxinize", "Lamyousitoxinized", "Lamyousitoxinizer", "Lamyousitoxinizers", "Lamyousitoxinizes", "Lamyousitoxinizing", "Lamyousitoxinly", "Lamyousitoxino", "Lamyousitoxinoid", "Lamyousitoxinoidea", "Lamyousitoxinoidal", "Lamyousitoxinoidally", "Lamyousitoxinoidea", "Lamyousitoxinoidea", "Lamyousitoxinoidean", "Lamyousitoxinoideans", "Lamyousitoxinoidemia", "Lamyousitoxinoidemica", "Lamyousitoxinoidemic", "Lamyousitoxinoidemics", "Lamyousitoxinoidia", "Lamyousitoxinoidiasis", "Lamyousitoxinoidiatic", "Lamyousitoxinoidiatic", "Lamyousitoxinoidic", "Lamyousitoxinoidical", "Lamyousitoxinoidically", "Lamyousitoxinoidicity", "Lamyousitoxinoidid", "Lamyousitoxinoididae", "Lamyousitoxinoidides", "Lamyousitoxinoidies", "Lamyousitoxinoidiid", "Lamyousitoxinoidiin", "Lamyousitoxinoidiium", "Lamyousitoxinoidillia", "Lamyousitoxinoidillial", "Lamyousitoxinoidillian", "Lamyousitoxinoidillians", "Lamyousitoxinoidillicidally", "Lamyousitoxinoidillida", "Lamyousitoxinoidillidaem", "Lamyousitoxinoidillidaeme", "Lamyousitoxinoidillidaemia", "Lamyousitoxinoidillidaemic", "Lamyousitoxinoidillidaemically", "Lamyousitoxinoidillidaemically", "Lamyousitoxinoidillidaemicals", "Lamyousitoxinoidillidaemics", "Lamyousitoxinoidillidaemics", "Lamyousitoxinoidillidaemics", "Lamyousitoxinoidillidaemics", "Lamyousitoxinoidillidaemics", "Manesar", "Mandi", "Mandi Adampur", "Meham", "Mohan", "Murthal", "Narela", "Narwal", "Narwali", "Narwana", "Naya Nangal", "Nayagaon", "Nayagarh", "Nayaganj", "Nilokheri", "Nirmal", "Nithal", "Nurpur", "Panipat", "Panipur", "Panth Parag", "Panwali", "Patiala", "Paunwali", "Peeth", "Pehowa", "Pehowa", "Peguali", "Pendi", "Peon", "Peranganj", "Perkha", "Perumal", "Perumalpur", "Perumapur", "Perupur", "Perupur", "Perwah", "Perwapur", "Perwahpur", "Perwalpur", "Perwani", "Perwanpur", "Perwara", "Perwapur", "Perwaripur", "Perwarpur", "Perwarpuri", "Perwas", "Perwasar", "Perwasan", "Perwasar", "Perwasan", "Perwasar", "Perwasar", "Perwasan", "Perwasar", "Perwasan", "Perwasar", "Perwasan", "Perwasar", "Perwasan", "Perwasar", "Perwasan", "Perwasar", "Perwasan"],
    "Himachal Pradesh": ["Bilaspur", "Chamba", "Dalhousie", "Dharamshala", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Rampur", "Shimla", "Sirmour", "Solan", "Suketi"],
    "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Jharsuguda", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Seraikella Kharsawan", "Simdega", "West Singhbhum"],
    "Karnataka": ["Bagalkote", "Belagavi", "Belgaum", "Bellary", "Bengaluru", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Bijapur", "Chamarajanagar", "Chikballapur", "Chikmagalur", "Chitradurga", "Davangere", "Dharwad", "Doddaballapur", "Dindigul", "Gadag", "Gulbarga", "Hassan", "Haveri", "Hubballi", "Hubballi Dharwad", "Kodagu", "Kolar", "Koppal", "Madikeri", "Mandya", "Mangaluru", "Mangalore", "Mysore", "Mysuru", "Nanjangud", "Raichur", "Ramanachari", "Ramanagara", "Ranibennur", "Rayadurg", "Rourkela", "Rudrapur", "Shivamogga", "Shimoga", "Suloganj", "Tumkur", "Udupi", "Uttara Kannada"],
    "Kerala": ["Alappuzha", "Attappadi", "Ernakulam", "Idukki", "Kannur", "Kanyakumari", "Kasaragod", "Kochi", "Kodungallur", "Kozhikode", "Kottayam", "Malappuram", "Nilambur", "Palakkad", "Palghat", "Pathanamthitta", "Poonjar", "Quilon", "Thodupuzha", "Thiruvananthapuram", "Thiruvalla", "Tirur", "Trivandrum", "Vadakara", "Valakom", "Wayanad"],
    "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Balod", "Baloda Bazar", "Barwaha", "Barwani", "Begumganj", "Beohari", "Betul", "Bilaspur", "Bhopal", "Bina", "Burhanpur", "Chhapara", "Chhindwara", "Churhat", "Damoh", "Datia", "Dewas", "Dindori", "Dohad", "Durg", "Gwalior", "Indore", "Itarsi", "Jabalpur", "Jhabua", "Jharsuguda", "Khandwa", "Khandwara", "Khargone", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Khimsar", "Kholapur", "Khonpur", "Khopra", "Khopur", "Khorabad", "Khorat", "Khorawada", "Khorawal", "Khorayagaon", "Khorayganj", "Khorbaon", "Khorela", "Khorethan", "Khorhara", "Khorha", "Khorhasan", "Khorhati", "Khorhij", "Khorhokar", "Khorholi", "Khorhopur", "Khorhotpur", "Khorhpalli", "Khorhpur", "Khorhs", "Khorhua", "Khorhui", "Khorhuji", "Khorhuse", "Khorhuti", "Khorhuz", "Khora", "Khorabad", "Khorabadh", "Khorabel", "Khorabad", "Khorabuddhi", "Khorachal", "Khorachi", "Khorada", "Khoradah", "Khoradani", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khoradanpur", "Khorambad", "Khorambandy", "Khorambar", "Khoramband", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambari", "Khorambe", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambedu", "Khorambela", "Khorambelakere", "Khorambelakere", "Khorambelakere", "Khorambelakere", "Khorambelakere", "Khorambelakere", "Khorambeli", "Khorambeliadee", "Khorambeligaon", "Khorambeligar", "Khorambelihagur", "Khorambeling", "Khorambeliya", "Khorambeliyagaon", "Khorambella", "Khorambellakere", "Khorambello", "Khorambeloe", "Khorambeloo", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khorambena", "Khori", "Khoril", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorina", "Khorind", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Khorindi", "Mandla", "Mandsaur", "Morena", "Muraina", "Murena", "Narsinghpur", "Narwari", "Narwaripur", "Narwarra", "Narwarspur", "Narwatpur", "Narwaul", "Narwavpur", "Narwawa", "Narwawpur", "Narwy", "Narwyapur", "Narwzpur", "Narzspur", "Neemari", "Neemaripoor", "Neemaripur", "Neemaripura", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Neemaripur", "Nemawar", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Nemdi", "Orai", "Pali", "Panagar", "Pangarh", "Pangarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Panchmarhi", "Rajgarh", "Raigarh", "Raigarh", "Raigarh", "Raigarh", "Raigarh", "Raigarh", "Raigad", "Raiganj", "Raigarh", "Raigarhabas", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa", "Raigarhabassa"],
    "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kanpur", "Karjat", "Kolhapur", "Latur", "Mahal", "Malshiras", "Mancherial", "Mandavgarh", "Mandawar", "Mandava", "Mandsaur", "Mandya", "Mangaluru", "Manipal", "Manpur", "Mansurkhan", "Manta", "Manti", "Mantpur", "Mantri", "Mantura", "Manuadu", "Manuchapir", "Manuganapelli", "Manugunta", "Manuguru", "Manuhara", "Manukonda", "Manulla", "Manullakere", "Manumapalli", "Manumbi", "Manumohan", "Manumohini", "Manungal", "Manungala", "Manungalapuram", "Manungalavettiil", "Manungalayar", "Manungalilla", "Manungalipalm", "Manungalipuram", "Manungalium", "Manungaliupa", "Manungaliupuram", "Manungalivalley", "Manungalivilas", "Manungali Vilas", "Manungaliyar", "Manungaliyer", "Manungalpalaiyam", "Manungalpaleyan", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Manungalpalayam", "Mumbai City", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Navi Mumbai", "Newasa", "Nighoj", "Nimgaon", "Nilanga", "Nilgiri", "Nimbahera", "Nimbaj", "Nimbakhera", "Nimbala", "Nimbayat", "Pune", "Puno", "Purandhar"],
    "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Kangleipak", "Kanyakumari", "Karimganj", "Kasaragod", "Kasba", "Kathua", "Kaubru", "Kaukhali", "Kaulakam", "Kauli", "Kayakudam"],
    "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri-Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
    "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Phek", "Saiha", "Serchhip", "Siaha"],
    "Nagaland": ["Chumoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
    "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Bhubaneswar", "Cuttack", "Debagarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Phulbani", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
    "Punjab": ["Amritsar", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Patiala", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran", "Yamunanagar"],
    "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Beawar", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Ganganagar", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawhar", "Jhunjhunu", "Jodhpur", "Karauli", "Khetri", "Kota", "Kuchamanbhil", "Lachmangarh", "Nasirabad", "Nawan Shahr", "Nayaganj", "Nimlai", "Oswari", "Pali", "Panwargarh", "Parvatsar", "Phagi", "Phugal", "Piparee", "Piprali", "Pipriya", "Pirawal", "Pirkpur", "Pirspur", "Pisganj", "Pratapgarh", "Raiganj", "Raipur", "Raj", "Rajakhsharia", "Rajaldi", "Rajaldpur", "Rajaldpura", "Rajaldpuriganj", "Rajaldpuri", "Rajaldi", "Rajalibad", "Rajalibada", "Rajalibadas", "Rajalkhed", "Rajalkuni", "Rajalkunpur", "Rajalodi", "Rajalodia", "Rajanem", "Rajanbir", "Rajanbari", "Rajanbarpur", "Rajanberpur", "Rajanbhad", "Rajanbir", "Rajanbirkhan", "Rajanbirpur", "Rajanbirodia", "Rajanbor", "Rajanbul", "Rajanchalani", "Rajanchal", "Rajanchandpur", "Rajanchandpuri", "Rajancharpet", "Rajanchharni", "Rajanchaura", "Rajanchaurapur", "Rajanchhaya", "Rajanchhel", "Rajanchherpur", "Rajanchhert", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur", "Rajanchherpur"],
    "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
    "Tamil Nadu": ["Ariyalur", "Attur", "Auzzavur", "Avinashi", "Atchampet", "Athipattu", "Athikonda", "Athikondapuram", "Chengalpattu", "Cherpet", "Chidambaram", "Chikballapur", "Chikmagalur", "Chiknayakanavoor", "Coimbatore", "Cuddalore", "Dindigul", "Erode", "Gingee", "Gobichettipalayam", "Gudalur", "Gudiyattam", "Hosur", "Indur", "Isakkimandapam", "Isakkur", "Isanur", "Jayankondam", "Kancheepuram", "Kangayam", "Kanyakumari", "Kapaleeshwarar", "Kasi", "Kasimpur", "Rameswaram", "Ranipet", "Rasipuram", "Rayavaram", "Rayavarampur", "Raya", "Ravichandran", "Rayadurg", "Royalwadi", "Rudrapur", "Rukmangadapuram", "Rumainagaram", "Rumpiapur", "Runcharapalli", "Rungapalm", "Rungapur", "Rungareddi", "Rungareddipalli", "Rungasasampalli", "Rungasasampure", "Rungasasampuri", "Rungatapalli", "Rungaviram", "Rungatwi", "Rungi", "Rungipur", "Rungipuriganj", "Rungipuri", "Rungipurithol", "Rungipuritoday", "Rungipuritola", "Rungipurivalai", "Rungipuriville", "Rungiya", "Rungiyan", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Rungiyanganj", "Salem", "Sankararampalli", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Sankalpur", "Villupuram", "Virudunagar", "Warangal"],
    "Telangana": ["Adilabad", "Hyderabad", "Jangaon", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubnagar", "Medak", "Medchal", "Mulugu", "Nagarkurnool", "Nalgonda", "Nizamabad", "Peddapalli", "Ranga Reddy", "Sangareddy", "Suryapet", "Tandur", "Vikarabad", "Warangal", "Wanaparthy", "Yadadri Bhongir"],
    "Tripura": ["Agartala", "Dhalai", "Gomti", "Khowai", "North Tripura", "Sepahijala", "Sipahijala", "South Tripura", "Unakoti", "West Tripura"],
    "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amroha", "Amethi", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
    "Uttarakhand": ["Almora", "Bageshwar", "Bijnor", "Chamoli", "Champawat", "Dehradun", "Garhwal", "Haridwar", "Nainital", "Pauri", "Pithoragarh", "Rudraprayag", "Tehri", "Udham Singh Nagar", "Uttarkashi"],
    "West Bengal": ["Alipurduar", "Asansol", "Bankura", "Bardhaman", "Birbhum", "Bishnupur", "Bolpur", "Burdwan", "Cooch Behar", "Darjeeling", "Dinajpur", "East Midnapore", "Haora", "Howrah", "Hooghly", "Hugli", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Koltabgarh", "Malda", "Medinipur", "Midnapore", "Murshidabad", "Nadia", "North 24 Parganas", "North Dinajpur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "Santipur", "South 24 Parganas", "South Dinajpur", "Sundarban", "Uttarkanya", "Uttar Dinajpur", "West Medinipur"],
    "Andaman and Nicobar Islands": ["Andaman", "Nicobars", "North and Middle Andaman", "South Andaman"],
    "Chandigarh": ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Dadra"],
    "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
    "Jammu and Kashmir": ["Anantnag", "Bandipore", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kargil", "Kishtwar", "Kulgam", "Kupwara", "Leh", "Pulwama", "Punch", "Ramban", "Rajauri", "Reasi", "Shopian", "Srinagar", "Samba", "Udhampur"],
    "Ladakh": ["Kargil", "Leh"],
    "Lakshadweep": ["Lakshadweep"],
    "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
  };

  // Helper functions for data generation
  function generateEmail(name) {
    return name.toLowerCase().replace(/\s+/g, '.') + '@blooddonation.org';
  }

  function generateWebsite(state) {
    return 'https://blood-' + state.toLowerCase().replace(/\s+/g, '-') + '.in';
  }

  const centerData = [];
  const hospitalData = [];

  Object.keys(stateDistrictMap).forEach(function (state) {
    stateDistrictMap[state].forEach(function (district, index) {
      centerData.push({
        name: district + " Regional Blood Center",
        state: state,
        district: district,
        address: district + ", " + state + ", India",
        phone: "+91 9000" + String(index + 11111).padStart(5, "0"),
        email: generateEmail(district + " Blood Center"),
        website: generateWebsite(state + "-" + district)
      });

      hospitalData.push({
        name: district + " Multi-Speciality Hospital",
        state: state,
        district: district,
        address: district + ", " + state + ", India",
        phone: "+91 9001" + String(index + 11111).padStart(5, "0"),
        email: generateEmail(district + " Hospital"),
        website: generateWebsite(state + "-" + district + "-hospital")
      });
    });
  });

  centerRowsContainer.innerHTML = centerData
    .map(function (item, idx) {
      return (
        '<tr class="filterable-row" data-state="' + item.state + '" data-district="' + item.district + '" data-center-id="' + idx + '">' +
        "<td>" + item.name + "</td>" +
        "<td>" + item.state + "</td>" +
        "<td>" + item.district + "</td>" +
        "<td>" + item.address + "</td>" +
        "<td>" + item.phone + "</td>" +
        '<td><a href="#" class="view-details-link" data-type="center" data-id="' + idx + '">View Details</a></td>' +
        "</tr>"
      );
    })
    .join("");

  hospitalRowsContainer.innerHTML = hospitalData
    .map(function (item, idx) {
      return (
        '<tr class="filterable-row" data-state="' + item.state + '" data-district="' + item.district + '" data-hospital-id="' + idx + '">' +
        "<td>" + item.name + "</td>" +
        "<td>" + item.state + "</td>" +
        "<td>" + item.district + "</td>" +
        "<td>" + item.address + "</td>" +
        '<td><a href="#" class="view-details-link" data-type="hospital" data-id="' + idx + '">View Details</a></td>' +
        "</tr>"
      );
    })
    .join("");

  const centerRows = Array.from(document.querySelectorAll("#centerRows .filterable-row"));
  const hospitalRows = Array.from(document.querySelectorAll("#hospitalRows .filterable-row"));
  const allRows = centerRows.concat(hospitalRows);

  const centerCount = document.getElementById("centerCount");
  const hospitalCount = document.getElementById("hospitalCount");
  const centerEmpty = document.getElementById("centerEmpty");
  const hospitalEmpty = document.getElementById("hospitalEmpty");

  function uniqueSorted(values) {
    return Array.from(new Set(values)).sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function getState(row) {
    return row.dataset.state || "";
  }

  function getDistrict(row) {
    return row.dataset.district || "";
  }

  // Searchable Dropdown Implementation
  function createSearchableDropdown(inputElement, dropdownElement, options, onSelect) {
    function showDropdown(itemsToShow) {
      dropdownElement.innerHTML = '';
      if (itemsToShow.length === 0) {
        dropdownElement.innerHTML = '<div class="dropdown-item">No results found</div>';
      } else {
        itemsToShow.forEach(function(item) {
          var div = document.createElement('div');
          div.className = 'dropdown-item';
          div.textContent = item;
          if (item === inputElement.value) {
            div.classList.add('selected');
          }
          div.addEventListener('click', function() {
            inputElement.value = item;
            dropdownElement.style.display = 'none';
            onSelect(item);
          });
          dropdownElement.appendChild(div);
        });
      }
      dropdownElement.style.display = 'block';
    }

    inputElement.addEventListener('focus', function() {
      showDropdown(options);
    });

    inputElement.addEventListener('input', function() {
      var query = inputElement.value.toLowerCase();
      var filtered = options.filter(function(item) {
        return item.toLowerCase().includes(query);
      });
      showDropdown(filtered);
    });

    document.addEventListener('click', function(event) {
      if (event.target !== inputElement && event.target !== dropdownElement) {
        dropdownElement.style.display = 'none';
      }
    });
  }

  // Initialize state dropdown
  const states = uniqueSorted(Object.keys(stateDistrictMap));
  createSearchableDropdown(stateFilterInput, stateFilterDropdown, states, function(selectedState) {
    updateDistrictOptions(selectedState);
    applyFilters();
  });

  function updateDistrictOptions(selectedState) {
    const districts = selectedState && stateDistrictMap[selectedState]
      ? uniqueSorted(stateDistrictMap[selectedState])
      : uniqueSorted(
          Object.keys(stateDistrictMap).reduce(function (acc, state) {
            return acc.concat(stateDistrictMap[state]);
          }, [])
        );

    districtFilterInput.disabled = !selectedState;
    districtFilterInput.value = '';
    districtFilterDropdown.innerHTML = '';
    
    createSearchableDropdown(districtFilterInput, districtFilterDropdown, districts, applyFilters);
  }

  function applyFilters() {
    const selectedState = stateFilterInput.value;
    const selectedDistrict = districtFilterInput.value;

    function updateRows(rows) {
      let visibleCount = 0;
      rows.forEach(function (row) {
        const stateMatches = !selectedState || getState(row) === selectedState;
        const districtMatches = !selectedDistrict || getDistrict(row) === selectedDistrict;
        const visible = stateMatches && districtMatches;
        row.hidden = !visible;
        if (visible) {
          visibleCount += 1;
        }
      });
      return visibleCount;
    }

    const visibleCenters = updateRows(centerRows);
    const visibleHospitals = updateRows(hospitalRows);

    if (centerCount) {
      centerCount.textContent = visibleCenters + " found";
    }
    if (hospitalCount) {
      hospitalCount.textContent = visibleHospitals + " found";
    }
    if (centerEmpty) {
      centerEmpty.hidden = visibleCenters !== 0;
    }
    if (hospitalEmpty) {
      hospitalEmpty.hidden = visibleHospitals !== 0;
    }

    const totalVisible = visibleCenters + visibleHospitals;
    const stateText = selectedState || "All States";
    const districtText = selectedDistrict || "All Districts";

    resultSummary.textContent =
      totalVisible + " result(s) for " + stateText + " / " + districtText + ".";
  }

  clearFiltersButton.addEventListener("click", function () {
    stateFilterInput.value = "";
    districtFilterInput.value = "";
    districtFilterInput.disabled = true;
    stateFilterDropdown.style.display = 'none';
    districtFilterDropdown.style.display = 'none';
    updateDistrictOptions('');
    applyFilters();
  });

  // Modal logic
  const detailsModal = document.getElementById("detailsModal");
  const closeModal = document.getElementById("closeModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalDetails = document.getElementById("modalDetails");
  const modalContactSection = document.getElementById("modalContactSection");
  const modalContact = document.getElementById("modalContact");
  const modalWebsiteSection = document.getElementById("modalWebsiteSection");
  const modalWebsite = document.getElementById("modalWebsite");
  const modalBloodAvailability = document.getElementById("modalBloodAvailability");
  const bloodAvailabilityInfo = document.getElementById("bloodAvailabilityInfo");

  function showModal(title, detailsHtml, contactHtml, websiteHtml, bloodInfoHtml) {
    modalTitle.textContent = title;
    modalDetails.innerHTML = detailsHtml;
    
    if (contactHtml) {
      modalContact.innerHTML = contactHtml;
      modalContactSection.style.display = 'block';
    } else {
      modalContactSection.style.display = 'none';
    }
    
    if (websiteHtml) {
      modalWebsite.innerHTML = websiteHtml;
      modalWebsiteSection.style.display = 'block';
    } else {
      modalWebsiteSection.style.display = 'none';
    }
    
    bloodAvailabilityInfo.innerHTML = bloodInfoHtml || "Not available.";
    detailsModal.style.display = "block";
  }

  closeModal.onclick = function () {
    detailsModal.style.display = "none";
  };
  window.onclick = function (event) {
    if (event.target === detailsModal) {
      detailsModal.style.display = "none";
    }
  };

  function getBloodAvailability(centerOrHospitalName) {
    const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    return (
      '<ul>' +
      groups
        .map(
          (g) =>
            `<li>${g}: <strong>${Math.random() > 0.3 ? Math.floor(Math.random() * 10 + 1) + ' units' : 'Not available'}</strong></li>`
        )
        .join("") +
      '</ul>'
    );
  }

  function handleViewDetailsClick(event) {
    event.preventDefault();
    const link = event.target;
    const type = link.dataset.type;
    const id = parseInt(link.dataset.id, 10);
    
    const data = type === 'center' ? centerData[id] : hospitalData[id];
    
    if (!data) return;
    
    let detailsHtml = `<p><strong>Name:</strong> ${data.name}</p>`;
    detailsHtml += `<p><strong>State:</strong> ${data.state}</p>`;
    detailsHtml += `<p><strong>District:</strong> ${data.district}</p>`;
    detailsHtml += `<p><strong>Address:</strong> ${data.address}</p>`;
    
    let contactHtml = '';
    if (data.phone) {
      contactHtml += `<p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>`;
    }
    if (data.email) {
      contactHtml += `<p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>`;
    }
    
    let websiteHtml = '';
    if (data.website) {
      websiteHtml += `<p><a href="${data.website}" target="_blank" rel="noopener noreferrer">Visit Official Website ↗</a></p>`;
    }
    
    const bloodInfoHtml = getBloodAvailability(data.name);
    showModal(data.name, detailsHtml, contactHtml, websiteHtml, bloodInfoHtml);
  }

  // Attach event listeners to all View Details links
  function attachDetailsListeners() {
    document.querySelectorAll(".view-details-link").forEach(function (link) {
      link.removeEventListener("click", handleViewDetailsClick);
      link.addEventListener("click", handleViewDetailsClick);
    });
  }

  attachDetailsListeners();

  // Initialize
  updateDistrictOptions('');
  applyFilters();

})();
