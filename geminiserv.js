// Install this file into /sbbs/exec/
//
// Edit /sbbs/ctrl/services.ini to include:
//
// Your gemini root will be /sbbs/text/gemini/
//
// [Gemini]
// Options=TLS
// Port=1965
// Command=geminiserv.js

require("url.js", 'URL');
load("string.js");
load("sbbsdefs.js");
load("nodedefs.js");

const GEMINI_PORT = client.socket.local_port;

function write(str)
{
    client.socket.send(str);
}

function writeln(str)
{
    write(str + "\r\n");
}

function send_file(req_file) {
    f = new File(req_file);
    if (!f.open("rb")) {
        writeln("51 NOT FOUND");
        return false;
    } else {
        ext = file_getext(req_file).substring(1).toLowerCase();
        switch (ext) {
            case "gemini":
            case "gmi":
                writeln("20 text/gemini");
                break;
            default:
                mime = File(system.ctrl_dir + "mime_types.ini");
                if (mime.open("r")) {
                    writeln("20 " + mime.iniGetValue(null, ext, "application/octet-stream"));
                    mime.close();
                } else {
                    writeln("20 application/octet-stream");
                }
                break;
        }
        

        c = f.readBin(1);
        while(!f.eof) {
            client.socket.sendBin(c, 1);
            c = f.readBin(1);
        }
        f.close();
        return true;
    }
}

request = client.socket.recvline(1024, 10);

if (request == null) {
    exit();
}

if (!file_isdir(system.text_dir + "gemini")) {
    mkdir(system.text_dir + "gemini");
}

purl = new URL(request);

if (purl.scheme != "gemini") {
    writeln("53 PROXY REQUEST REFUSED");
    exit();
}


path = purl.path;

if (path == "") {
    path = "/";
} 

req_file = fullpath(system.text_dir + "gemini" + fullpath(path));

if (!req_file.startsWith(fullpath(system.text_dir + "gemini"))) {
    writeln("51 NOT FOUND");
    exit();
}

if (file_isdir(req_file)) {
    if (file_exists(backslash(req_file) + "index.gmi")) {
        send_file(backslash(req_file) + "index.gmi");
    } else if (file_exists(backslash(req_file) + "index.gemini")) {
        send_file(backslash(req_file) + "index.gemini");
    } else {
        var diritems = directory(backslash(req_file) + '*');

        writeln("20 text/gemini");
        writeln("# index of " + fullpath(path));

        diritems.forEach(function(e) {
            if (GEMINI_PORT != 1965) {
                if (file_isdir(e)) {
                    f = e.substring(0, e.length - 1).split(/[\\/]/).pop();
                    writeln("=> gemini://" + system.inet_addr + ":" + GEMINI_PORT + backslash(path) +  f + " " + f + "/"); 
                } else {
                    f = file_getname(e);
                    writeln("=> gemini://" + system.inet_addr + ":" + GEMINI_PORT + backslash(path) +  f + " " + f); 
                }
            } else {
                if (file_isdir(e)) {
                    e.trim
                    f = e.substring(0, e.length - 1).split(/[\\/]/).pop();
                    writeln("=> gemini://" + system.inet_addr + backslash(path) +  f + " " + f + "/"); 
                } else {
                    f = file_getname(e);
                    writeln("=> gemini://" + system.inet_addr + backslash(path) +  f + " " + f); 
                }
            }
        })
    }
} else {
    if (file_exists(req_file)) {
        send_file(req_file);
    } else {
        writeln("51 NOT FOUND");
    }
}
 