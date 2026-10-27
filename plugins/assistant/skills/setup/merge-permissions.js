// Добавляет правила разрешений MCP-инструментов в ~/.claude/settings.json.
// Остальные ключи и уже существующие правила не трогает; перед записью делает копию.
//
// Запуск (macOS):
//   osascript -l JavaScript merge-permissions.js plan  '<правила>'   — показать, что добавится
//   osascript -l JavaScript merge-permissions.js apply '<правила>'   — копия + запись
// <правила> = {"allow":["mcp__…"],"ask":["mcp__…"],"deny":["mcp__…"]}
// Третий аргумент (необязательно) — другой путь к settings.json.
// Принимаются только точные имена MCP-инструментов (mcp__сервер__инструмент), без масок.

ObjC.import('Foundation');

function run(argv) {
  var mode = argv[0];
  if (mode !== 'plan' && mode !== 'apply') throw new Error('Первый аргумент: plan или apply');
  var rules = JSON.parse(argv[1] || '{}');
  var path = $(argv[2] || ($.NSHomeDirectory().js + '/.claude/settings.json')).stringByResolvingSymlinksInPath.js;
  var fm = $.NSFileManager.defaultManager;
  var RULE = /^mcp__[A-Za-z0-9_-]+__[A-Za-z0-9_-]+$/;
  var LISTS = ['allow', 'ask', 'deny'];

  var exists = fm.fileExistsAtPath(path);
  var settings = {};
  if (exists) {
    var raw = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null);
    if (raw.isNil()) throw new Error('Не удалось прочитать ' + path);
    settings = JSON.parse(raw.js); // битый JSON — ошибка, файл не трогаем
  }
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('settings.json — не объект JSON');
  var perms = settings.permissions || {};
  if (typeof perms !== 'object' || Array.isArray(perms)) throw new Error('permissions — не объект JSON');

  var added = {}, conflicts = [];
  LISTS.forEach(function (k) {
    var incoming = rules[k] || [];
    if (!Array.isArray(incoming)) throw new Error(k + ' — должен быть списком');
    var current = Array.isArray(perms[k]) ? perms[k].slice() : [];
    added[k] = [];
    incoming.forEach(function (r) {
      if (typeof r !== 'string' || !RULE.test(r)) throw new Error('Не точное имя MCP-инструмента: ' + r);
      if (current.indexOf(r) === -1) { current.push(r); added[k].push(r); }
      LISTS.forEach(function (other) {
        if (other !== k && Array.isArray(perms[other]) && perms[other].indexOf(r) !== -1) conflicts.push(r + ': уже в ' + other + ', добавляется в ' + k);
      });
    });
    if (added[k].length) perms[k] = current;
  });

  var total = added.allow.length + added.ask.length + added.deny.length;
  var result = { mode: mode, file: path, file_existed: !!exists, added: added, conflicts: conflicts, written: false };

  if (mode === 'apply' && total > 0) {
    var posix = null;
    if (exists) {
      var attrs = fm.attributesOfItemAtPathError(path, null);
      if (!attrs.isNil()) posix = attrs.objectForKey('NSFilePosixPermissions');
      var d = new Date();
      var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
      var stamp = d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + '-' + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
      var backup = path + '.bak-' + stamp;
      if (!fm.copyItemAtPathToPathError(path, backup, null)) throw new Error('Не удалось сделать копию ' + backup);
      result.backup = backup;
    } else {
      fm.createDirectoryAtPathWithIntermediateDirectoriesAttributesError($(path).stringByDeletingLastPathComponent, true, $(), null);
    }
    settings.permissions = perms;
    var text = JSON.stringify(settings, null, 2) + '\n';
    if (!$(text).writeToFileAtomicallyEncodingError(path, true, $.NSUTF8StringEncoding, null)) throw new Error('Не удалось записать ' + path);
    if (posix) fm.setAttributesOfItemAtPathError($.NSDictionary.dictionaryWithObjectForKey(posix, 'NSFilePosixPermissions'), path, null);
    JSON.parse($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null).js); // проверка
    result.written = true;
  }
  return JSON.stringify(result, null, 2);
}
