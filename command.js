require("./config.js")
const fs = require("fs")
const moment = require('moment');

const {
    getGroupAdmins,
} = require("./lib/library.js")

// Membaca file JSON untuk daftar tugas
let tugasData = JSON.parse(fs.readFileSync('tugas.json', 'utf-8'));

// Fungsi untuk menyimpan perubahan data ke JSON
const saveData = () => {
    fs.writeFileSync('tugas.json', JSON.stringify(tugasData, null, 2));
};

const formatTanggal = (inputDate) =>
    new Date(inputDate).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

const getReminder = (deadlineDate) => {
    const diffDays = Math.ceil((new Date(deadlineDate) - new Date()) / 86400000);
    return diffDays > 0 ? `⚠️ *H-${diffDays} [REMAINDER]* ⚠️` : diffDays === 0 ? "⚠️ *HARI INI* ⚠️" : "‼️ *LEWAT DEADLINE* ‼️";
};

function getWeeklyDeadlines() {
    // Baca file tugas.json
    const data = JSON.parse(fs.readFileSync('tugas.json', 'utf8'));
    const today = moment().startOf('day'); // Awal hari
    const weekLater = moment().add(7, 'days').endOf('day'); // Akhir hari 7 hari ke depan
    const tasksThisWeek = [];

    // Loop melalui setiap mata kuliah
    for (const kode in data) {
        const mataKuliah = data[kode];
        const tugas = mataKuliah.tugas;

        // Loop melalui setiap tugas
        for (const item of tugas) {
            const deadline = moment(item.deadline).startOf('day'); // Awal hari deadline
            if (deadline.isBetween(today, weekLater, 'days', '[]')) {
                const hMinus = deadline.diff(today, 'days');
                tasksThisWeek.push({
                    kode: kode,
                    id: item.id,
                    judul: item.judul,
                    hMinus: hMinus,
                });
            }
        }
    }

    // Urutkan tugas berdasarkan deadline (H-...)
    tasksThisWeek.sort((a, b) => a.hMinus - b.hMinus);

    // Buat output
    let output = '';

    if (tasksThisWeek.length === 0) {
        output = '✅ Tidak ada tugas pada minggu ini!';
    } else {
        output = `*Daftar Tugas Minggu Ini:*\n\n`;
        tasksThisWeek.forEach((task, index) => {
            output += `${index + 1}. *H-${task.hMinus} [${task.kode.toUpperCase()}.${task.id}]* ${task.judul}\n`;
        });
        output += `\n*Total Tugas:* ${tasksThisWeek.length}\nKetikkan: *!detail.<kode_matkul>.<nomor_tugas>*`;
    }

    return output;
}

module.exports = async (fell, m) => {
    try {
        const body = (
            (m.mtype === 'conversation' && m.message.conversation) ||
            (m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
            (m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
            (m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
            (m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
            (m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
            (m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
        ) ? (
            (m.mtype === 'conversation' && m.message.conversation) ||
            (m.mtype === 'imageMessage' && m.message.imageMessage.caption) ||
            (m.mtype === 'documentMessage' && m.message.documentMessage.caption) ||
            (m.mtype === 'videoMessage' && m.message.videoMessage.caption) ||
            (m.mtype === 'extendedTextMessage' && m.message.extendedTextMessage.text) ||
            (m.mtype === 'buttonsResponseMessage' && m.message.buttonsResponseMessage.selectedButtonId) ||
            (m.mtype === 'templateButtonReplyMessage' && m.message.templateButtonReplyMessage.selectedId)
        ) : '';

        const budy = (typeof m.text === 'string') ? m.text : '';
        const prefixRegex = /^[°zZ#$@*+,.?=''():√%!¢£¥€π¤ΠΦ_&><`™©®Δ^βα~¦|/\\©^]/;
        const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '!';
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1)
        const text = q = args.join(" ")
        // console.log(`prefix: ` + prefix, `isCmd: ` + isCmd, `command: ` + command, `text: ` + text)
        const sender = m.key.fromMe ? (fell.user.id.split(':')[0] + '@s.whatsapp.net' || fell.user.id) : (m.key.participant || m.key.remoteJid)
        const botNumber = await fell.decodeJid(fell.user.id)
        const senderNumber = sender.split('@')[0]
        const pushname = m.pushName || `${senderNumber}`
        const isBot = botNumber.includes(senderNumber)
        const fatkuns = (m.quoted || m)
        const quoted = (fatkuns.mtype == 'buttonsMessage') ? fatkuns[Object.keys(fatkuns)[1]] : (fatkuns.mtype == 'templateMessage') ? fatkuns.hydratedTemplate[Object.keys(fatkuns.hydratedTemplate)[1]] : (fatkuns.mtype == 'product') ? fatkuns[Object.keys(fatkuns)[0]] : m.quoted ? m.quoted : m
        const mime = (quoted.m || quoted).mimetype || ''
        const qmsg = (quoted.m || quoted)
        const isCreator = (m && m.sender && [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)) || false;

        // console.log(sender, senderNumber)

        const groupMetadata = m.isGroup ? await fell.groupMetadata(m.chat).catch(e => { }) : ''
        const groupName = m.isGroup ? groupMetadata.subject : ''
        const participants = m.isGroup ? await groupMetadata.participants : ''
        const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : ''
        const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false
        const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false
        const groupOwner = m.isGroup ? groupMetadata.owner : ''
        const isGroupOwner = m.isGroup ? (groupOwner ? groupOwner : groupAdmins).includes(m.sender) : false

        if (isCmd) console.log("~> [CMD]", command, "from", pushname, "in", m.isGroup ? "Group Chat" : "Private Chat", '[' + args.length + ']');

        switch (command) {
            case 'menu':
                m.reply('Hola')
                break;

            case 'matkul':
                let daftar = "📃 Berikut Daftar Mata Kuliah:\n\n";
                let counter = 1;
                for (const kode in tugasData) {
                    daftar += `${counter}. ${kode.toUpperCase()} - ${tugasData[kode].nama}\n`;
                    counter++;
                }
                daftar += `\nKetikkan: *!tugas.<kode_matkul>* untuk melihat daftar tugas\nContoh: *!tugas.tee201*`
                m.reply(daftar)
                break;

            default:
                // Command untuk melihat tugas berdasarkan kode matkul
                if (command.startsWith('tugas.')) {
                    const kodeMatkul = command.split('.')[1];
                    if (tugasData[kodeMatkul]) {
                        const tugasList = tugasData[kodeMatkul].tugas;
                        if (tugasList.length === 0) {
                            m.reply(`ℹ️ Belum ada tugas untuk *${kodeMatkul.toUpperCase()} - ${tugasData[kodeMatkul].nama}*`);
                        } else {
                            let daftarTugas = `📃 Berikut Daftar Tugas: *${kodeMatkul.toUpperCase()} - ${tugasData[kodeMatkul].nama}*\n\n`;
                            tugasList.forEach((tugas, index) => {
                                daftarTugas += `${index + 1}. ${tugas.judul}\n`;
                            });
                            daftarTugas += `\nKetikkan: *!detail.${kodeMatkul}.<nomor>* untuk melihat detail tugas`;
                            m.reply(daftarTugas);
                        }
                    } else {
                        m.reply('⚠️ Kode mata kuliah tidak ditemukan.');
                    }
                }
                // Command untuk melihat detail tugas tertentu
                if (command.startsWith('detail.') && command.split('.').length === 3) {
                    const kodeMatkul = command.split('.')[1];
                    const nomorTugas = command.split('.')[2] - 1;
                    if (tugasData[kodeMatkul] && tugasData[kodeMatkul].tugas[nomorTugas]) {
                        const tugas = tugasData[kodeMatkul].tugas[nomorTugas];
                        const detailTugas = `${getReminder(tugas.deadline)}\n` +
                            `📑 *${kodeMatkul.toUpperCase()} - ${tugasData[kodeMatkul].nama}*\n\n` +
                            `📝 *${tugas.judul}*\n\n` +
                            `📅 *Tanggal:* ${formatTanggal(tugas.tanggal)}\n` +
                            `📅 *Deadline:* ${formatTanggal(tugas.deadline)} \n\n` +
                            `📒 *Note:*\n${tugas.note}`;
                        m.reply(detailTugas);
                    } else {
                        m.reply('Tugas tidak ditemukan.');
                    }
                }
                // Command untuk menambahkan tugas baru
                if (command.startsWith('addtugas.')) {
                    // console.log(command)
                    if (senderNumber === "6285691253593" || senderNumber === "6289601922906") {
                        const input = command.split('.');
                        const kodeMatkul = input[1].trim();
                        const nomorTugas = parseInt(input[2].trim());

                        // Memecah body pesan berdasarkan baris
                        const lines = text.split('\n');

                        // Pastikan ada cukup baris
                        if (lines.length < 6) {
                            return m.reply('‼️ Format pesan tidak valid. Pastikan untuk mengikuti template yang benar.');
                        }

                        // Mengambil judul, tanggal, deadline, note, link soal, dan link jawaban
                        const judul = lines[0].trim().replace(/\*/g, ''); // Menghapus tanda bintang
                        const tanggal = lines[2].split(':')[1]?.trim().replace(/\*/g, ''); // Mengambil setelah ':' dan menghapus tanda bintang
                        const deadline = lines[3].split(':')[1]?.trim().replace(/\*/g, ''); // Mengambil setelah ':' dan menghapus tanda bintang

                        // Mengambil semua baris note (mulai dari baris ke-9 hingga akhir)
                        const noteLines = lines.slice(6).map(line => line.trim().replace(/\*/g, '')); // Hapus bintang dan spasi
                        const note = noteLines.join('\n'); // Gabungkan semua baris dengan newline

                        // Menambahkan tugas baru ke data
                        if (tugasData[kodeMatkul]) {
                            const existingTugasIndex = tugasData[kodeMatkul].tugas.findIndex(tugas => tugas.id === nomorTugas);

                            if (existingTugasIndex !== -1) {
                                // Jika ID sudah ada, perbarui tugas yang ada
                                tugasData[kodeMatkul].tugas[existingTugasIndex] = {
                                    id: nomorTugas,
                                    judul: judul,
                                    tanggal: tanggal,
                                    deadline: deadline,
                                    note: note,
                                };
                                m.reply(`✅ Tugas dengan ID ${nomorTugas} telah diperbarui untuk ${kodeMatkul.toUpperCase()} - ${tugasData[kodeMatkul].nama}`);
                            } else {
                                // Jika ID tidak ada, tambahkan tugas baru
                                tugasData[kodeMatkul].tugas.push({
                                    id: nomorTugas,
                                    judul: judul,
                                    tanggal: tanggal,
                                    deadline: deadline,
                                    note: note,
                                });
                                m.reply(`✅ Tugas baru ditambahkan untuk ${kodeMatkul.toUpperCase()} - ${tugasData[kodeMatkul].nama}`);
                            }

                            saveData(); // Simpan perubahan ke file JSON
                        } else {
                            m.reply('⚠️ Kode mata kuliah tidak ditemukan.');
                        }
                    } else {
                        m.reply('‼️ Hanya admin yang dapat menggunakan perintah ini.');
                    }
                }
                // Command untuk menghapus tugas tertentu
                if (command.startsWith('deltugas.')) {
                    if (senderNumber === "6285691253593" || senderNumber === "6289601922906") {
                        const input = command.split('.');
                        const kodeMatkul = input[1].trim();
                        const nomorTugas = parseInt(input[2].trim());

                        // Cek apakah kode mata kuliah ada
                        if (tugasData[kodeMatkul]) {
                            // Mencari index tugas yang ingin dihapus
                            const existingTugasIndex = tugasData[kodeMatkul].tugas.findIndex(tugas => tugas.id === nomorTugas);

                            if (existingTugasIndex !== -1) {
                                // Menghapus tugas dari array
                                tugasData[kodeMatkul].tugas.splice(existingTugasIndex, 1);
                                saveData(); // Simpan perubahan ke file JSON
                                m.reply(`✅ Tugas dengan ID ${nomorTugas} telah dihapus untuk ${kodeMatkul.toUpperCase()} - ${tugasData[kodeMatkul].nama}`);
                            } else {
                                m.reply(`⚠️ Tugas dengan ID ${nomorTugas} tidak ditemukan untuk ${kodeMatkul.toUpperCase()}.`);
                            }
                        } else {
                            m.reply('⚠️ Kode mata kuliah tidak ditemukan.');
                        }
                    } else {
                        m.reply('‼️ Hanya admin yang dapat menggunakan perintah ini.');
                    }

                }
                // Command untuk pengingat deadline
                if (command === 'deadline') {
                    m.reply(`${getWeeklyDeadlines()}`)
                }
                break;
        }
    } catch (err) {
        console.log(require('util').format(err));
    }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(`Update ${__filename}`);
    delete require.cache[file];
    require(file);
});
