ake aku akan memberikan konsepnya lebih lengkap lagi dan kali ini posisimu adalah sebagai fullstack developer profesional, tapi kali ini kita akan fokus ke backend dulu, jadi ini konsepnya :

  project ini akan menjadi sebuah website yang menjalankan bisnis micro VPS, dimana nantinya kami akan menyewa vps sedang seperti ram 4 gb dan 2 core, lalu membaginya menjadi beberapa micro vps (3-4
  bagian) yang nantinya akan kami juak harian atau paling mentok 1 minggu... jadi kami menawarkan 3 servis, price nya ada di 3500/hari, 9000/3 hari, dan 18000/1 minggu. Nahh dari situ nantinya akan
  ada pilihan fitur/paket tambahan yang dimana akan mendapatkan subdomain dari pihak kami yang nantinya akan bisa disambungkan langsung di vps nya, serta bisa ci/cd yang langsung bisa hidup di
  subdomain tersebut sesuai dengan projek mereka, nah nantinya setiap langganan yang expired akan di suspend selama 7 hari, apabila sudah melebihi maka akan dihapus permanen. itu adalah konsep inti nya

  selanjutnya aku akan menjelaskan jobdesk ku serta hal apa yang menjadi tugasku... jadi aku akan membuatkan backend nya khususnya di bagian logika untuk servis VPS nya (payment gateway menyusul
  karena lagi registrasi), nah yang aku urus akan berfokus di membagi jadi micro VPS pakai INCUS, lalu memastikan walaupun bebas tetap ada batasan di vps nya sesuai privacy policy yang ada di penjual
  vps dan micro vps ku sendiri, memastikan vps nya bisa setup otomatis sesuai keinginan user yang membeli pengen setup gimana, serta restart dan  reset di vps nya apabila terjadi kendala dan dari sisi
  user membutuhkannya.

  tapi sebelum kamu mengerjakan aku memiliki pertanyaan :
  1. saat ini datanya sudah memakai supabase, tapi apakah sebaiknya kami juga menggunakan posgres local yang akan jalan di vps utama nya untuk menyimpan data sensitif? sedangkan supabase digunakan
  untuk menyimpan yang berat seperti image dan sejenisnya... menurutmu gimana? apakah sebaiknya menggunakan posgres juga atau full supabase aja? mengingat bisnis ini juga masih awal dan skala kecil
  2. karena bisnis ini masih belum tentu diterima, jadi kami niatnya beli vps saat bisnis sudah acc dan akan mulai menjual, nahh jika begitu apa setup yang bisa dilakukan sekarang sebelum membeli vps?
  apakah sistemku yang linux ini bisa dimanfaatkan untuk uji coba? atau bagaimana supaya fungsi utamanya bisa dites dan berhasil?
  3. aku ingin customer bisa memanfaatkan layanan subdomain serta ci/cd nya build secara otomatis lewat github, mengingat sumber daya micro vps nya kecil, jadinya tidak bisa build di vps langsung dan
  harus menggunakan github untuk build, tapi pertanyaanku apakah bisa menyambungkan ci/cd nya otomatis dengan via login github lalu pilih repo yang mana seperti vercel? karna kalau ketika mereka
  memilih paket untuk mendapatkan subdomain dan bisa ci/cd, misalkan hanya tutorial untuk menyambungkannya kok cukup ribet dan tidak otomatis? atau gimana?
  4. apakah semua proses itu bisa dilakukan di website ini?
