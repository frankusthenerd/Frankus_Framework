// =============================================================================
// Frankus Browser API
// Programmed by Francois Lamini
//
// Log:
//
// 10/25/2024 - Restructuring code.
// =============================================================================

// =============================================================================
// Frankus Constants
// =============================================================================

const FRANKUS_NO_VALUE_FOUND = -1;
const FRANKUS_CELL_W = 16;
const FRANKUS_CELL_H =  32;
const FRANKUS_SCREEN_W = 960;
const FRANKUS_SCREEN_H = 640;
const FRANKUS_MOBILE_W = 360;
const FRANKUS_MOBILE_H = 640;
const FRANKUS_MOUSE_LEFT = 0;
const FRANKUS_MOUSE_WHEEL = 1;
const FRANKUS_MOUSE_RIGHT = 2;

// =============================================================================
// Global Variables
// =============================================================================

let frankus_code = "";
let frankus_http = location.href.split(/:/).shift() + "://";
let frankus_layout = null;

// =============================================================================
// File Implementation
// =============================================================================

/**
 * The Frankus File allows you to read files over the web. These are read
 * directly from the database so very secure.
 */
class frankusFile {

  /**
   * Creates a file module.
   * @param name The name of the file.
   */
  constructor(name) {
    this.file = name;
    this.lines = [];
    this.data = "";
    this.message = "";
    this.error = "";
    this.on_read = null;
    this.on_write = null;
    this.on_not_found = null;
    this.on_denied = null;
    this.pointer = 0;
  }

  /**
   * Reads the contents of the file.
   */
  Read() {
    let ajax = new XMLHttpRequest();
    let self = this;
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) { // Ok.
          self.data = ajax.responseText;
          self.lines = Frankus_Split(self.data);
          if (self.on_read) {
            self.on_read();
          }
        }
        else if (ajax.status == 404) { // Not found.
          self.error = ajax.responseText;
          if (self.on_not_found) {
            self.on_not_found();
          }
        }
        else if (ajax.status == 401) { // Access denied.
          self.error = ajax.responseText;
          if (self.on_denied) {
            self.on_denied();
          }
        }
      }
    };
    ajax.open("GET", "db/" + this.file, true);
    ajax.send(null);
  }

  /**
   * Writes the contents of a file.
   */
  Write() {
    let ajax = new XMLHttpRequest();
    let self = this;
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) { // Ok.
          self.message = ajax.responseText;
          if (self.on_write) {
            self.on_write();
          }
        }
        else if (ajax.status == 404) { // Not found.
          self.error = ajax.responseText;
          if (self.on_not_found) {
            self.on_not_found();
          }
        }
        else if (ajax.status == 401) { // Access denied.
          self.error = ajax.responseText;
          if (self.on_denied) {
            self.on_denied();
          }
        }
      }
    };
    // Collapse lines into data.
    if (this.lines.length > 0) {
      this.data = this.lines.join("\n");
    }
    ajax.open("POST", "db/" + this.file, true);
    ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    ajax.send("data=" + encodeURIComponent(this.data) + "&passcode=" + encodeURIComponent(frankus_code));
  }

  /**
   * Writes the contents of a file directly to the server.
   */
  Write_Direct() {
    let ajax = new XMLHttpRequest();
    let self = this;
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) { // Ok.
          self.message = ajax.responseText;
          if (self.on_write) {
            self.on_write();
          }
        }
        else if (ajax.status == 404) { // Not found.
          self.error = ajax.responseText;
          if (self.on_not_found) {
            self.on_not_found();
          }
        }
        else if (ajax.status == 401) { // Access denied.
          self.error = ajax.responseText;
          if (self.on_denied) {
            self.on_denied();
          }
        }
      }
    };
    // Collapse lines into data.
    if (this.lines.length > 0) {
      this.data = this.lines.join("\n");
    }
    ajax.open("POST", this.file, true);
    ajax.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    ajax.send("data=" + encodeURIComponent(this.data) + "&passcode=" + encodeURIComponent(frankus_code));
  }

  /**
   * Adds a line to the file.
   * @param line The line to add.
   */
  Add(line) {
    this.lines.push(line);
  }

  /**
   * Adds an object to the file.
   * @param object The object to add to the file.
   */
  Add_Object(object) {
    this.Add("object");
    for (let field in object) {
      let value = object[field];
      if (value instanceof Array) {
        this.Add(field + "=" + value.join(","));
      }
      else {
        this.Add(field + "=" + value);
      }
    }
    this.Add("end");
  }

  /**
   * Adds a bunch of lines to the file.
   * @param lines The list of lines to add.
   */
  Add_Lines(lines) {
    this.lines = this.lines.concat(lines);
  }

  /**
   * Removes a line at a specified index.
   * @param index The index of the line to remove.
   * @throws An error if the index is not valid.
   */
  Remove(index) {
    Frankus_Check_Condition(((index >= 0) && (index < this.lines.length)), "Cannot remove line that does not exist.");
    this.lines.splice(index, 1);
  }

  /**
   * Gets the number of lines in the file.
   * @return The number of lines in the file.
   */
  Count() {
    return this.lines.length;
  }

  /**
   * Gets the string at the index.
   * @param index The index of the string.
   * @return The string at the index.
   * @throws An error if the string is not present.
   */
  Get_Line_At(index) {
    Frankus_Check_Condition(((index >= 0) && (index < this.lines.length)), "Cannot remove line that does not exist.");
    return this.lines[index];
  }
  
  /**
   * Gets a line from the file sequentially.
   * @return The read line.
   * @throws An error if no more lines can be read.
   */
  Get_Line() {
    Frankus_Check_Condition(this.Has_More_Lines(), "No more lines to read.");
    return this.lines[this.pointer++];
  }

  /**
   * Reads a numeric value from an index.
   * @return The number read.
   * @throws An error if the number could not be read.
   */
  Get_Number() {
    Frankus_Check_Condition(this.Has_More_Lines(), "No more lines to read.");
    return parseInt(this.lines[this.pointer++]);
  }

  /**
   * Reads an object from the file.
   * @param object The object to read in.
   * @throws An error if the object could not be read.
   */
  Get_Object(object) {
    Frankus_Check_Condition(this.Has_More_Lines(), "No more lines to read.");
    let line = this.lines[this.pointer++];
    if (line != "object") {
      throw new Error("Object identifier missing.");
    }
    while (line != "end") {
      Frankus_Check_Condition(this.Has_More_Lines(), "No more lines to read.");
      line = this.lines[this.pointer++];
      let pair = line.split("=");
      if (pair.length == 2) {
        let name = pair[0];
        let value = pair[1];
        if (!isNaN(value)) {
          object[name] = parseInt(value);
        }
        else {
          object[name] = value;
        }
      }
    }
  }

  /**
   * Clears out the file's lines.
   */
  Clear() {
    this.lines = [];
    this.pointer = 0;
  }
  
  /**
   * Determines if a file has more lines.
   * @return True if there are more lines, false otherwise.
   */
  Has_More_Lines() {
    return (this.pointer < this.lines.length);
  }

  /**
   * Gets the extension of the given file.
   * @param file The file path.
   * @return The file extension without the dot.
   */
  static Get_Extension(file) {
    return file.split("/").pop().replace(/^\w+\./, "");
  }

  /**
   * Gets the name of a file.
   * @param file The file to get the name of.
   * @return The name of the file.
   */
  static Get_File_Name(file) {
    return file.split("/").pop();
  }

  /**
   * Gets the title of the file.
   * @param file The file to get the title of.
   * @return The title of the file.
   */
  static Get_File_Title(file) {
    return frankusFile.Get_File_Name(file).replace(/\.\w+$/, "");
  }

  /**
   * Determines if a file is a folder.
   * @param file The name of the file.
   */
  static Is_Folder(file) {
    return !file.match(/\w+\.\w+$/);
  }

  /**
   * Escapes a folder path to platform independent path separators.
   * @param folder The folder path.
   * @return The path that is platform independent.
   */
  static Escape_Path(folder) {
    return folder.replace(/(\/|\\|:)/g, "/");
  }

  /**
   * Queries a set of files from the server.
   * @param search The search string.
   * @param folder The folder to search for the files.
   * @param on_query Called with the file list passed in.
   */
  static Query_Files(search, folder, on_query) {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) { // Ok.
          let file_list = Frankus_Split(ajax.responseText);
          on_query(file_list);
        }
      }
    };
    ajax.open("GET", "query-files?folder=" + encodeURIComponent(folder) + "&search=" + encodeURIComponent(search), true);
    ajax.send(null);
  }

  /**
   * Downloads a file.
   * @param name The name of the file.
   * @param data The file data. (text)
   */
  static Download(name, data) {
    let file = new Blob([ data ], {
      type: "text/plain"
    });
    // Create download clicker.
    let clicker = document.createElement("a");
    clicker.download = name;
    clicker.href = window.URL.createObjectURL(file);
    clicker.style.display = "none";
    clicker.click();
  }

  /**
   * Deletes a file.
   * @param name The name of the file to delete.
   * @param on_delete Called if the file is deleted.
   */
  static Delete(name, on_delete) {
    let ajax = new XMLHttpRequest();
    ajax.onreadystatechange = function() {
      if (ajax.readyState == 4) {
        if (ajax.status == 200) { // Ok.
          on_delete();
        }
      }
    };
    ajax.open("GET", "delete" + name + "?passcode=" + encodeURIComponent(frankus_code), true);
    ajax.send(null);
  }
  
}

// =============================================================================
// Frankus Config
// =============================================================================

/**
 * The Frankus Config reader lets you read configurations from the database. Very
 * good for client side configurations.
 */
class frankusConfig {

  /**
   * Creates a new config module.
   * @param name The name of the config file.
   * @param on_load Called when the config file is loaded.
   */
  constructor(name, on_load) {
    this.config = {};
    this.properties = [];
    let self = this;
    let file = new frankusFile("Config/" + name + ".txt");
    file.Read();
    file.on_read = function() {
      let line_count = file.lines.length;
      for (let line_index = 0; line_index < line_count; line_index++) {
        let line = file.lines[line_index];
        let pair = line.split("=");
        if (pair.length == 2) {
          let name = pair[0];
          let value = pair[1];
          if (!isNaN(pair[1])) {
            value = parseInt(pair[1]);
          }
          self.config[name] = value;
          self.properties.push(name);
        }
      }
      on_load();
    };
  }

  /**
   * Gets a numeric property value.
   * @param name The name of the property.
   * @return The value of the property.
   * @throws An error if the property does not exist.
   */
  Get_Property(name) {
    if (this.config[name] == undefined) {
      throw new Error("Property value " + name + " does not exist.");
    }
    return this.config[name];
  }

}

// =============================================================================
// Frankus Browser
// =============================================================================

/**
 * The Frankus Browser detects which browser the user is running and returns
 * information about it. This is useful for detecting old browsers.
 */
class frankusBrowser {
 
  /**
   * Create a new browser object.
   */
  constructor() {
    this.name = "";
    this.ip = "";
    this.port = "";
  }

  /**
   * Detects the type of browser that is running the system.
   * @param on_success Called if the browser is successfull detected.
   * @param on_error Called if there was a problem detecting the browser. A parameter containing the error is passed in.
   */
  Detect(on_success, on_error) {
    let old_browser = false;
    let unknown_browser = false;
    let unsupported_browser = false;
    if (navigator.userAgent.match(/Android/)) { // Android
      this.name = "android";
      this.ip = location.hostname;
      this.port = location.port;
    }
    else if (navigator.userAgent.match(/Chrome\/\d+/)) { // Chrome
      let parts = navigator.userAgent.split(/\s+/);
      // Find pair.
      let part_count = parts.length;
      for (let part_index = 0; part_index < part_count; part_index++) {
        let part = parts[part_index];
        if (part.match(/Chrome/)) {
          let pair = part.split(/\//);
          let version = parseInt(pair[1]);
          if (version < 50) { // Older than 2016?
            old_browser = true;
          }
          break;
        }
      }
      this.name = "chrome";
      this.ip = location.hostname;
      this.port = location.port;
    }
    else if (navigator.userAgent.match(/Firefox\/\d+/)) { // Firefox
      let parts = navigator.userAgent.split(/\s+/);
      // Find pair.
      let part_count = parts.length;
      for (let part_index = 0; part_index < part_count; part_index++) {
        let part = parts[part_index];
        if (part.match(/Firefox/)) {
          let pair = part.split(/\//);
          let version = parseInt(pair[1]);
          if (version < 50) { // Older than 2016?
            old_browser = true;
          }
          break;
        }
      }
      this.name = "firefox";
      this.ip = location.hostname;
      this.port = location.port;
    }
    else { // Unknown browser.
      unknown_browser = true;
    }
    if (unknown_browser) {
      window.addEventListener("load", function() {
        on_error("browser-unknown");
      }, false);
    }
    else if (old_browser) {
      window.addEventListener("load", function() {
        on_error("browser-old");
      }, false);
    }
    else if (unsupported_browser) {
      window.addEventListener("load", function() {
        on_error("unsupported-browser");
      }, false);
    }
    else {
      // Wait for window to load first.
      window.addEventListener("load", function() {
        on_success();
      }, false);
    }
  }
  
}

// =============================================================================
// Frankus Layout Engine
// =============================================================================

/**
 * The Frankus Layout engine is core to the Frankus client side system. It allows
 * the pages to be managed.
 */
class frankusLayout {

  /**
   * Creates a new Frankus layout engine.
   */
  constructor() {
    this.grid = null;
    this.grid_w = 0;
    this.grid_h = 0;
    this.screen_w = 0;
    this.screen_h = 0;
    this.entities = [];
    this.properties = {};
    this.components = {};
    this.timer = null;
    this.pages = {};
    this.current_page = "";
    this.home_page = "";
    this.hash_off = false;
    this.elements = {};
    this.nav_condition = function() {
      return true;
    };
    this.browser = new frankusBrowser();
    this.on_init = null;
    this.on_component_init = null;
  }

  /**
   * Grabs all elements by ID and creates references to them.
   */
  Map_Element_Ids() {
    let tags = document.getElementsByTagName("*");
    let tag_count = tags.length;
    for (let tag_index = 0; tag_index < tag_count; tag_index++) {
      let tag = tags[tag_index];
      if (tag.hasAttribute("id")) {
        let id = tag.getAttribute("id");
        this.elements[id] = tag;
      }
    }
  }

  /**
   * Creates page containers given that the page hash is populated.
   */
  Create_Page_Containers() {
    for (let name in this.pages) {
      let container_id = this.pages[name].container;
      let container = document.createElement("div");
      container.setAttribute("class", "container");
      container.setAttribute("id", container_id);
      container.innerHTML = "Loading... please wait.";
      document.body.appendChild(container);
    }
  }

  /**
   * Remaps the IDs of the pages to containers.
   */
  Remap_Page_Ids() {
    for (let name in this.pages) {
      let container_id = this.pages[name].container;
      this.pages[name].container = this.elements[container_id];
    }
  }

  /**
   * Initializes the global parse grid.
   * @param viewport_w The width of the viewport in pixels.
   * @param viewport_h The height of the viewport in pixels.
   */
  Init_Grid(viewport_w, viewport_h) {
    this.screen_w = viewport_w;
    this.screen_h = viewport_h;
    this.grid_w = Math.floor(viewport_w / FRANKUS_CELL_W);
    this.grid_h = Math.floor(viewport_h / FRANKUS_CELL_H);
    this.grid = [];
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      let row = [];
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        row.push("");
      }
      this.grid.push(row);
    }
  }

  /**
   * Clears out the grid.
   */
  Clear_Grid() {
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        this.grid[cell_y][cell_x] = "";
      }
    }
  }

  /**
   * Maps the grid out. This is used for debugging purposes to actually output
   * the grid itself.
   */
  Map_Grid() {
    grid_str = "";
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        let cell = this.grid[cell_y][cell_x];
        this.grid_str += String(cell);
      }
      this.grid_str += "<br />";
    }
    return this.grid_str;
  }

  /**
   * Parses the grid given the layout text.
   * @param text The text containing the layout.
   */
  Parse_Grid(text) {
    let lines = Frankus_Split(text);
    let line_count = (lines.length > this.grid_h) ? this.grid_h : lines.length;
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = lines[line_index];
      let char_count = (line.length > this.grid_w) ? this.grid_w : line.length;
      for (let char_index = 0; char_index < char_count; char_index++) {
        let ch = line.charAt(char_index);
        this.grid[line_index][char_index] = ch;
      }
    }
  }

  /**
   * Parses the markdown stored in the grid.
   * @param text The text containing the layout markdown.
   * @param container The container to render the entities to.
   */
  Parse_Markdown(text, container) {
    try {
      let html = [];
      this.entities = [];
      // Parse the properties.
      text = this.Parse_Properties(text);
      // Now parse the grid.
      this.Parse_Grid(text);
      // Parse the entities.
      while (this.Has_Entity()) {
        let entity = this.Parse_Entity();
        this.entities.push(entity);
      }
      this.Render_Entities(container);
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Determines if there is an entity still on the grid.
   */
  Has_Entity() {
    let has_entity = false;
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        let cell = this.grid[cell_y][cell_x];
        if (cell.match(/\[|\{|\(|\+/)) { // Entity identifier.
          has_entity = true;
          break;
        }
      }
    }
    return has_entity;
  }

  /**
   * Parses one entity from the grid and removes it. This entity is turned into
   * a component and a reference is generated with the component.
   */
  Parse_Entity() {
    let entity = {
      id: "",
      type: "",
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    for (let cell_y = 0; cell_y < this.grid_h; cell_y++) {
      for (let cell_x = 0; cell_x < this.grid_w; cell_x++) {
        let cell = this.grid[cell_y][cell_x];
        if (cell == '+') {
          entity.x = cell_x;
          entity.y = cell_y;
          entity.width = 1;
          entity.height = 1;
          entity.type = "box";
          this.Parse_Box(entity);
          // Break out of double loop.
          cell_y = this.grid_h;
          break;
        }
        else if (cell == '[') {
          entity.x = cell_x;
          entity.y = cell_y;
          entity.width = 1;
          entity.height = 1;
          entity.type = "field";
          this.Parse_Field(entity);
          // Break out of double loop.
          cell_y = this.grid_h;
          break;
        }
        else if (cell == '{') {
          entity.x = cell_x;
          entity.y = cell_y;
          entity.width = 1;
          entity.height = 1;
          entity.type = "panel";
          this.Parse_Panel(entity);
          // Break out of double loop.
          cell_y = this.grid_h;
          break;
        }
        else if (cell == '(') {
          entity.x = cell_x;
          entity.y = cell_y;
          entity.width = 1;
          entity.height = 1;
          entity.type = "button";
          this.Parse_Button(entity);
          // Break out of double loop.
          cell_y = this.grid_h;
          break;
        }
        else {
          continue; // Ignore but allow looking for other entities.
        }
      }
    }
    return entity;
  }

  /**
   * Parses a box entity.
   * @param entity The entity which is being parsed. This will fill in with data.
   * @throws String If any error was encountered during the parse.
   */
  Parse_Box(entity) {
    // We'll navigate in this path: right -> down -> left -> up
    let pos_x = entity.x; // Skip the plus.
    let pos_y = entity.y;
    let rev_width = 1;
    let rev_height = 1;
    let id_str = "";
    // Clear out first plus.
    this.grid[pos_y][pos_x] = "";
    // Navigate right.
    pos_x++;
    while (pos_x < this.grid_w) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '+') {
        entity.width++;
        entity.id = id_str.replace(/\-/g, "");
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell.match(/\-|\w/)) { // Box Edge
        id_str += cell;
        entity.width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid box. (right)");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this.grid_w) {
      throw new Error("Truncated box. (width)");
    }
    // Navigate down.
    pos_y++; // Skip the first plus.
    while (pos_y < this.grid_h) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '+') {
        entity.height++;
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell == '|') {
        entity.height++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid box. (down)");
      }
      pos_y++;
    }
    // Check for truncated object.
    if (pos_y == this.grid_h) {
      throw new Error("Truncated box. (height)");
    }
    // Navigate left.
    pos_x--; // Skip that first plus.
    while (pos_x >= 0) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '+') {
        rev_width++;
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell == '-') {
        rev_width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid box. (left)");
      }
      pos_x--;
    }
    if (rev_width != entity.width) {
      throw new Error("Not a valid box. (width mismatch)");
    }
    // Navigate up.
    pos_y--;
    while (pos_y >= 0) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '') { // Plus was removed but validated before.
        rev_height++;
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell == '|') {
        rev_height++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid box. (up)");
      }
      pos_y--;
    }
    if (rev_height != entity.height) {
      throw new Error("Not a valid box. (height mismatch)");
    }
  }

  /**
   * Parses a field entity.
   * @param entity The entity which is being parsed. This will fill in with data.
   * @throws String If any error was encountered during the parse.
   */
  Parse_Field(entity) {
    let pos_x = entity.x;
    let pos_y = entity.y;
    let id_str = "";
    // Clear out initial bracket.
    this.grid[pos_y][pos_x] = "";
    // Parse out field.
    pos_x++; // Pass over initial bracket.
    while (pos_x < this.grid_w) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == ']') {
        entity.width++;
        entity.id = id_str.replace(/\s/g, "");
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell.match(/\w|\s/)) {
        id_str += cell;
        entity.width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid field.");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this.grid_w) {
      throw new Error("Truncated field.");
    }
  }

  /**
   * Parses a panel entity.
   * @param entity The entity which is being parsed. This will fill in with data.
   * @throws String If any error was encountered during the parse.
   */
  Parse_Panel(entity) {
    let pos_x = entity.x;
    let pos_y = entity.y;
    let id_str = "";
    // Clear out initial curly.
    this.grid[pos_y][pos_x] = "";
    // Skip over initial curly.
    pos_x++;
    // Go ahead and parse the rest.
    while (pos_x < this.grid_w) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == '}') {
        entity.width++;
        entity.id = id_str.replace(/\s/g, "");
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell.match(/\w|\s/)) {
        id_str += cell;
        entity.width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid panel.");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this.grid_w) {
      throw new Error("Truncated panel.");
    }
  }

  /**
   * This parses the button entity.
   * @param entity The entity which is being parsed. This will fill in with data.
   * @throws String If any error was encountered during the parse.
   */
  Parse_Button(entity) {
    let pos_x = entity.x;
    let pos_y = entity.y;
    let id_str = "";
    this.grid[pos_y][pos_x] = "";
    pos_x++;
    while (pos_x < this.grid_w) {
      let cell = this.grid[pos_y][pos_x];
      if (cell == ')') {
        entity.width++;
        entity.id = id_str.replace(/\s/g, "");
        this.grid[pos_y][pos_x] = "";
        break;
      }
      else if (cell.match(/\w|\s/)) {
        id_str += cell;
        entity.width++;
        this.grid[pos_y][pos_x] = "";
      }
      else {
        throw new Error("Not a valid button.");
      }
      pos_x++;
    }
    // Check for truncated object.
    if (pos_x == this.grid_w) {
      throw new Error("Truncated button.");
    }
  }

  /**
   * Parses all properties related to entities.
   * @param text The text to parse into properties.
   * @throws String If the property is not formatted correctly.
   */
  Parse_Properties(text) {
    let lines = Frankus_Split(text);
    let line_count = lines.length;
    let new_lines = [];
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = lines[line_index];
      if (line.match(/\w+\s*\->/)) { // Property signature.
        let record = line.trim();
        let pair = record.split(/\s*\->\s*/);
        if (pair.length == 2) {
          let entity_id = pair[0];
          let value = pair[1];
          // Create entity property object.
          this.properties[entity_id] = {};
          let props = value.split(/\s*,\s*/);
          let prop_count = props.length;
          for (let prop_index = 0; prop_index < prop_count; prop_index++) {
            let prop = props[prop_index].split(/\s*=\s*/);
            if (prop.length == 2) {
              let name = prop[0];
              let value = prop[1];
              this.properties[entity_id][name] = value;
            }
            else {
              throw new Error("Property is missing value.");
            }
          }
        }
        else {
          throw new Error("Entity ID is missing properties.");
        }
      }
      else { // We're not including property lines.
        new_lines.push(line);
      }
    }
    return new_lines.join("\n");
  }

  /**
   * Renders all of the entities as components.
   * @param container The container to render the entities to.
   */
  Render_Entities(container) {
    container.innerHTML = "";
    let entity_count = this.entities.length;
    for (let entity_index = 0; entity_index < entity_count; entity_index++) {
      let entity = this.entities[entity_index];
      let settings = this.properties[entity.id] || {};
      entity.x *= FRANKUS_CELL_W;
      entity.y *= FRANKUS_CELL_H;
      entity.width *= FRANKUS_CELL_W;
      entity.height *= FRANKUS_CELL_H;
      let component = null;
      // We can override the entity type in the settings.
      if (settings["change-type"] != undefined) {
        entity.type = settings["change-type"];
      }
      if (entity.type == "box") {
        component = new frankusBox(entity, settings, container);
      }
      else if (entity.type == "field") {
        component = new frankusField(entity, settings, container);
      }
      else if (entity.type == "panel") {
        component = new frankusPanel(entity, settings, container);
      }
      else if (entity.type == "button") {
        component = new frankusButton(entity, settings, container)
      }
      else if (entity.type == "select") {
        component = new frankusSelect(entity, settings, container);
      }
      else if (entity.type == "edit") {
        component = new frankusEdit(entity, settings, container);
      }
      else if (entity.type == "checkbox") {
        component = new frankusCheckbox(entity, settings, container);
      }
      else if (entity.type == "radio") {
        component = new frankusRadio(entity, settings, container);
      }
      else if (entity.type == "wiki") {
        component = new frankusWiki(entity, settings, container);
      }
      else if (entity.type == "picture") {
        component = new frankusPicture(entity, settings, container);
      }
      else if (entity.type == "menu") {
        component = new frankusMenu(entity, settings, container);
      }
      else if (entity.type == "toolbar") {
        component = new frankusToolbar(entity, settings, container);
      }
      else if (entity.type == "image-button") {
        component = new frankusImage_Button(entity, settings, container);
      }
      else if (entity.type == "label") {
        component = new frankusLabel(entity, settings, container);
      }
      else if (entity.type == "marquee") {
        component = new frankusMarquee(entity, settings, container);
      }
      else if (entity.type == "tool-palette") {
        component = new frankusTool_Palette(entity, settings, container);
      }
      else if (entity.type == "grid-view") {
        component = new frankusGrid_View(entity, settings, container);
      }
      else if (entity.type == "comic-reader") {
        component = new frankusComic_Reader(entity, settings, container);
      }
      else if (entity.type == "code-editor") {
        component = new frankusCode_Editor(entity, settings, container);
      }
      else if (entity.type == "frame") {
        component = new frankusFrame(entity, settings, container);
      }
      else if (entity.type == "bump-map-editor") {
        component = new frankusBump_Map_Editor(entity, settings, container);
      }
      else if (entity.type == "sound-editor") {
        component = new frankusSound_Editor(entity, settings, container);
      }
      else if (entity.type == "board") {
        component = new frankusBoard(entity, settings, container);
      }
      else if (entity.type == "chat") {
        component = new frankusChat(entity, settings, container);
      }
      else if (entity.type == "uploader") {
        component = new frankusUploader(entity, settings, container);
      }
      else if (entity.type == "link") {
        component = new frankusLink(entity, settings, container);
      }
      else if (entity.type == "color-picker") {
        component = new frankusColor_Picker(entity, settings, container);
      }
      else {
        throw new Error("Wrong entity type: " + entity.type);
      }
      this.components[entity.id] = component;
    }
  }

  /**
   * Loads a layout from a file and renders it.
   * @param file The file to load the layout from.
   * @param on_load Called if the layout is parsed and rendered.
   */
  Load_Layout(file, container, on_load) {
    let layout_file = new frankusFile("Pages/" + file);
    let self = this;
    layout_file.on_read = function() {
      self.Parse_Markdown(layout_file.data, container);
      on_load();
    };
    layout_file.on_not_found = function() {
      console.log("Error: " + layout_file.error);
      on_load();
    };
    layout_file.Read();
  }

  /**
   * Loads a page in a list of pages.
   * @param index The index of the page to load.
   * @param on_load Called when all pages have been loaded.
   */
  Load_Page(index, on_load) {
    let names = Object.keys(this.pages);
    if (index < names.length) {
      let name = names[index];
      let page = this.pages[name];
      let file = Frankus_Is_Mobile() ? page.mobile : page.layout;
      if (file) {
        let self = this;
        this.Load_Layout(file, page.container, function() {
          self.Load_Page(index + 1, on_load);
        });
      }
      else {
        this.Load_Page(index + 1, on_load);
      }
    }
    else {
      on_load();
    }
  }

  /**
   * Resizes a container according to the size of the browser window.
   * @param container The container to resize.
   */
  Resize_Container(container) {
    let width = document.body.clientWidth;
    let height = document.body.clientHeight;
    let scale_x = width / this.screen_w;
    let scale_y = height / this.screen_h;
    if (this.browser.name == "firefox") {
      scale_x = (width - 8) / this.screen_w;
      scale_y = (height - 8) / this.screen_h;
    }
    if (height > this.screen_h) {
      container.style.transformOrigin = "center center";
      container.style.transform = "scaleX(" + scale_y + ") scaleY(" + scale_y + ") translateZ(0)";
    }
  }

  /**
   * Resizes all page containers in accordance with the window size.
   */
  Resize_Page_Containers() {
    for (let name in this.pages) {
      let container = this.pages[name].container;
      this.Resize_Container(container);
    }
  }

  /**
   * Flips to a named page.
   * @param name The name of the page to flip to.
   */
  Flip_Page(name) {
    let result = this.nav_condition();
    if (result) {
      if (this.pages[name]) { // Does page exist?
        let container = this.pages[name].container;
        // Post process current page before changing it.
        if (this.current_page.length > 0) {
          let old_page_container = this.pages[this.current_page].container;
          old_page_container.style.display = "none";
          if (this.pages[this.current_page].pause) {
            this.pages[this.current_page].pause();
          }
        }
        else { // Hide all pages!
          for (let page in this.pages) {
            let page_container = this.pages[page].container;
            page_container.style.display = "none";
          }
        }
        // Display current page.
        this.current_page = name;
        container.style.display = "block";
        if (this.pages[name].resume) {
          this.pages[name].resume();
        }
        // Set the hash of the page.
        if (!this.hash_off) {
          location.hash = "#" + name;
        }
        // Set home page.
        if (this.home_page.length == 0) {
          this.home_page = name;
        }
      }
    }
  }

  /**
   * Initializes the navigation handler to deal with browser navigation buttons.
   */
  Init_Navigation_Handler() {
    let self = this;
    window.addEventListener("hashchange", function(event) {
      if (location.hash.length > 0) {
        let page = decodeURIComponent(location.hash.slice(1));
        if (page.length > 0) {
          self.Flip_Page(page);
        }
        else {
          self.Flip_Page(self.home_page);
        }
      }
      else {
        self.Flip_Page(self.home_page);
      }
    }, false);
  }

  /**
   * Initializes a handler to resize the page containers when the window resizes.
   */
  Init_Resize_Handler() {
    // Create handlers for window resize.
    let self = this;
    window.addEventListener("resize", function(event) {
      if (!Frankus_Is_Mobile()) {
        self.Resize_Page_Containers();
      }
    }, false);
  }

  /**
   * Adds a page to the layout for processing.
   * @param name The name of the page.
   * @param container The name of the page container.
   * @param pause Callback for when page is paused.
   * @param resume Callback for when page is resumed.
   * @param layout The layout file name.
   * @param mobile The mobile layout file name.
   */
  Add_Page(name, container, pause, resume, layout, mobile) {
    this.pages[name] = {
      container: container,
      pause: pause,
      resume: resume,
      layout: layout,
      mobile: mobile
    };
  }

  /**
   * Creates the layout.
   * @param page The name of the initial page to open.
   */
  Create(page) {
    let self = this;
    this.browser.Detect(function() {
      self.Create_Page_Containers();
      self.Map_Element_Ids();
      self.Remap_Page_Ids();
      let is_mobile = Frankus_Is_Mobile();
      if (is_mobile) {
        self.Init_Grid(FRANKUS_MOBILE_W, FRANKUS_MOBILE_H);
      }
      else {
        self.Init_Grid(FRANKUS_SCREEN_W, FRANKUS_SCREEN_H);
      }
      if (!is_mobile) {
        self.Resize_Page_Containers();
      }
      setTimeout(function() {
        self.Load_Page(0, function() {
          // Initialize navigation handler.
          self.Init_Navigation_Handler();
          self.on_component_init();
          self.on_init();
          self.Init_Resize_Handler();
          self.Flip_Page(page);
        });
      }, 1); // Set a delay to sync DOM.
      // Respond to resize event.
      window.addEventListener("resize", function(event) {
        self.Resize_Page_Containers();
      }, false);
    }, function(error) {
      console.log("Browser Error: " + error);
    });
  }

}

// =============================================================================
// Frankus Base Component
// =============================================================================

/**
 * This is the base component for all components. This is used to build any new
 * component for Frankus.
 */
class frankusComponent {

  /**
   * Instantiates the component. The following default properties exist:
   *
   * - change-type - This changes the type of component. Values can be:
   * -> "box"
   * -> "field"
   * -> "panel"
   * -> "button"
   * -> "select"
   * -> "edit"
   * -> "checkbox"
   * -> "radio"
   * -> "wiki"
   * -> "picture"
   * -> "menu"
   * -> "toolbar"
   * -> "image-button"
   * -> "label"
   * -> "marquee"
   * -> "tool-palette"
   * -> "grid-view"
   * -> "comic-reader"
   * -> "code-editor"
   * -> "frame"
   * -> "board"
   * -> "chat"
   * -> "link"
   * -> "color-picker"
   *
   * @param entity The parsed entity object.
   * @param settings The parsed settings hash.
   * @param container The container where the component will be added.
   */
  constructor(entity, settings, container) {
    this.entity = entity;
    this.settings = settings;
    this.container = container;
    this.elements = {};
  }

  /**
   * This is where you create the component. You override this to process all
   * settings and create the layout associated with the entity.
   */
  Create() {
    // This is meant to be overridden.
  }

  /**
   * Creates an event on the component. This should be overridden per component.
   * @param name The name of the event, like "click".
   * @param handler The event handler. It is formatted like this:
   * %
   * function(component, event) {
   *
   * }
   * %
   */
  On(name, handler) {
    // This is meant to be overridden.
  }

  /**
   * Gets the value of the component.
   * @return The value of the component.
   */
  Get_Value() {
    return this.elements[this.entity.id].innerHTML;
  }

  /**
   * Sets the value of the component.
   * @param value The value to set the component to.
   */
  Set_Value(value) {
    this.elements[this.entity.id].innerHTML = value;
  }

  /**
   * Creates an element from a JSON tree and places it into a container.
   * Elements are formatted into a JSON object tree.
   * %
   *    {
   *      id: "container", // The ID of the element.
   *      type: "div", // The type of element tag.
   *      attrib: { // The element attributes.
   *        width: 100,
   *        height: 100
   *      },
   *      css: { // CSS properties.
   *        "position": "absolute",
   *        "background-color": "red"
   *      },
   *      subs: [ // All sub elements.
   *        {
   *          id: "area",
   *          type: "div"
   *        }
   *      ]
   *    }
   * %
   * @param element The JSON element tree.
   * @param container The container to attach the element tree. It can be a name.
   * @return A reference to the entire element tree.
   */
  Create_Element(element, container) {
    // First create the element.
    let object = document.createElement(element.type); // The tag type.
    // Set the attributes.
    if (element.attrib) {
      let keys = Object.keys(element.attrib);
      let key_count = keys.length;
      for (let key_index = 0; key_index < key_count; key_index++) {
        let attrib = keys[key_index];
        object.setAttribute(attrib, element.attrib[attrib]);
      }
    }
    // Set the style or CSS. This would overwrite template styles.
    if (element.css) {
      let keys = Object.keys(element.css);
      let key_count = keys.length;
      let style_str = "";
      for (let key_index = 0; key_index < key_count; key_index++) {
        let style = keys[key_index];
        let value = element.css[style];
        style_str += String(style + ": " + value + "; ");
      }
      object.setAttribute("style", style_str); // We want to allow conventional style strings.
    }
    // Store element reference.
    if (element.id) {
      this.elements[element.id] = object; // Reference.
      // Add in an ID property for object.
      object.frankus_id = element.id;
      object.setAttribute("id", element.id); // Set and ID to identify in debugger.
    }
    // Set text inside of element.
    if (element.text) {
      object.innerHTML = Frankus_Compile_Markdown(element.text);
    }
    // Parse all other sub elements.
    if (element.subs) {
      let sub_count = element.subs.length;
      for (let sub_index = 0; sub_index < sub_count; sub_index++) {
        let sub = element.subs[sub_index];
        let sub_ref = this.Create_Element(sub, object);
      }
    }
    // Install handler to prevent form submission.
    if (object.tagName == "INPUT") {
      object.addEventListener("keypress", function(event) {
        let key = event.keyCode;
        if (key == 13) { // Enter
          event.preventDefault();
        }
      }, false);
    }
    // Prevent tabbing away from text boxes.
    if (object.tagName == "TEXTAREA") {
      object.addEventListener("keydown", function(event) {
        let key = event.keyCode;
        if (key == 9) { // Tab
          event.preventDefault();
        }
      }, false);
    }
    // Do we add in the element to a container?
    if (typeof container == "string") {
      if (this.elements[container] != undefined) {
        this.elements[container].appendChild(object);
      }
    }
    else {
      container.appendChild(object);
    }
    // Very important! Return element reference.
    return object;
  }

  /**
   * Shows an element.
   * @param element The name of the element to be shown.
   */
  Show(element) {
    this.elements[element].style.display = "block";
  }

  /**
   * Hides an element.
   * @param element The name of the element to hide.
   */
  Hide(element) {
    this.elements[element].style.display = "none";
  }

  /**
   * Changes the color of an element.
   * @param element The name of the element to change the color.
   * @param color The color of the element.
   */
  Change_Color(element, color) {
    this.elements[element].style.backgroundColor = color;
  }

  /**
   * Capitalize the name and return a formatted version.
   * @param name The name to format.
   * @return The unformatted name.
   */
  Capitalize(name) {
    let words = name.split(/_/);
    let word_count = words.length;
    let title = [];
    for (let word_index = 0; word_index < word_count; word_index++) {
      let word = words[word_index];
      let first_letter = word.substring(0, 1).toUpperCase();
      let other = word.substring(1);
      title.push(first_letter + other);
    }
    return title.join(" ");
  }

  /**
   * Creates a button JSON element. The settings are as follows.
   *
   * - label - The text to display on the button.
   * - left - The left coordinate.
   * - top - The top coordinate.
   * - right - The right coordinate.
   * - bottom - The bottom coordinate.
   * - width - The width of the button.
   * - height - The height of the button.
   * - bg-color - The background color.
   * - fg-color - The foreground color.
   * - opacity - The opacity, ranges for 0 to 1.
   * - position - Can be "static", "absolute", or "relative".
   * - show - Can be "on" or "off".
   *
   * @param id The ID of the button.
   * @param settings Specifies the dimensions and style of the button.
   * @return The JSON structure of the button element.
   */
  Make_Button(id, settings) {
    let left = (settings["left"] != undefined) ? settings["left"] : "auto";
    let top = (settings["top"] != undefined) ? settings["top"] : "auto";
    let right = (settings["right"] != undefined) ? settings["right"] : "auto";
    let bottom = (settings["bottom"] != undefined) ? settings["bottom"] : "auto";
    return {
      id: id,
      type: "div",
      text: settings["label"],
      css: {
        "position": settings["position"] || "absolute",
        "left": (left != "auto") ? left + "px" : left,
        "top": (top != "auto") ? top + "px" : top,
        "right": (right != "auto") ? right + "px" : right,
        "bottom": (bottom != "auto") ? bottom + "px" : bottom,
        "width": settings["width"] + "px",
        "height": settings["height"] + "px",
        "border-radius": "5px",
        "background-color": settings["bg-color"] || "black",
        "color": settings["fg-color"] || "white",
        "opacity": settings["opacity"] || "1",
        "line-height": settings["height"] + "px",
        "text-align": "center",
        "cursor": String(Frankus_Get_Image("Cursor.png", true) + ", default"),
        "font-family": "Regular, sans-serif",
        "font-size":  "16px",
        "font-weight": "bold"
      }
    };
  }

  /**
   * Creates an edit control. The settings are as follows:
   *
   * - label - The text to display on the edit control.
   * - value - The value that the edit control has.
   * - border - The border around the edit control.
   * - fg-color - The foreground color.
   * - bg-color - The background color.
   *
   * @param id The ID of the edit control.
   * @param settings The settings associated with the edit control.
   * @return The JSON structure of the edit control.
   */
  Make_Edit(id, settings) {
    return {
      id: id,
      type: "textarea",
      attrib: {
        nowrap: "",
        value: settings["value"] || "",
        placeholder: settings["label"] || ""
      },
      css: {
        "margin": "0",
        "margin-left": "1px",
        "margin-top": "1px",
        "padding": "2px",
        "border": settings["border"] || "1px solid silver",
        "width": "calc(100% - 8px)",
        "height": "calc(100% - 8px)",
        "resize": "none",
        "font-family": '"Courier New", monospace',
        "font-size": "16px",
        "color": settings["fg-color"] || "black",
        "background-color": settings["bg-color"] || "white"
      }
    };
  }

  /**
   * Creates a generic form with sub elements in it.
   * @param id The id of the form.
   * @param subs All of the sub elements of the form.
   * @return The form element JSON.
   */
  Make_Form(id, subs) {
    return {
      id: id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "margin": "0",
        "padding": "0",
        "left": "0",
        "top": "0",
        "width": "100%",
        "height": "100%"
      },
      subs: subs
    };
  }

  /**
   * Creates a generic field. The settings are as follows:
   *
   * - label - The default text to display.
   * - type - The type of field. i.e. "text", "password", etc.
   * - border - The border style.
   * - fg-color - The text color.
   * - bg-color - The color of the field.
   * - font - The font to use for the field.
   * - size - The size of the font.
   * - height - The height of the field. Pass it in if setting font size.
   * - object-width - The width of the object itself.
   * - object-height - The height of the object itself.
   * - value - The default value for the field.
   *
   * @param id The ID of the field.
   * @param settings The properties for the field.
   * @return The JSON structure for the field.
   */
  Make_Field(id, settings) {
    let font_size = settings["size"] || settings["height"];
    return {
      id: id,
      type: "input",
      attrib: {
        type: settings["type"] || "text",
        placeholder: settings["label"] || "",
        value: settings["value"] || ""
      },
      css: {
        "width": (settings["object-width"]) ? String("calc(" + settings["object-width"] + " - 8px)") : "calc(100% - 8px)",
        "height": (settings["object-height"]) ? String("calc(" + settings["object-height"] + "px - 8px)") : "calc(100% - 8px)",
        "padding": "2px",
        "margin": "0",
        "margin-left": "1px",
        "margin-top": "1px",
        "border": settings["border"] || "1px solid silver",
        "color": settings["fg-color"] || "black",
        "background-color": settings["bg-color"] || "white",
        "font-family": settings["font"] || "Regular, sans-serif",
        "font-size": (settings["height"] != undefined) ? String(font_size - 10) + "px" : font_size + "px",
        "cursor": Frankus_Get_Image("Cursor.png", true) + ", default"
      }
    };
  }

  /**
   * Creates a generic drop down list. The settings are as follows:
   *
   * - border - The border style.
   * - fg-color - The text color.
   * - bg-color - The color of the field.
   * - font - The font to use for the field.
   * - size - The size of the font.
   * - height - The height of the field. Pass it in if setting font size.
   * - object-width - The width of the object itself.
   * - object-height - The height of the object itself.
   *
   * @param id The ID of the field.
   * @param items An array of items representing the list.
   * @param settings The properties for the field.
   * @return The JSON structure for the field.
   */
  Make_Dropdown_List(id, items, settings) {
    let font_size = settings["size"] || settings["height"];
    let options = [];
    // Populate options.
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let option = {
        id: id + "_option_" + item_index,
        type: "option",
        text: item,
        attrib: {
          value: item
        }
      };
      options.push(option);
    }
    return {
      id: id,
      type: "select",
      attrib: {
        type: settings["type"] || "text",
        placeholder: settings["label"] || ""
      },
      css: {
        "width": (settings["object-width"]) ? String("calc(" + settings["object-width"] + " - 8px)") : "calc(100% - 8px)",
        "height": (settings["object-height"]) ? String("calc(" + settings["object-height"] + "px - 8px)") : "100%",
        "padding": "2px",
        "margin": "0",
        "margin-left": "1px",
        "margin-top": "1px",
        "border": settings["border"] || "1px solid silver",
        "color": settings["fg-color"] || "black",
        "background-color": settings["bg-color"] || "white",
        "font-family": settings["font"] || "Regular, sans-serif",
        "font-size": (settings["height"] != undefined) ? String(font_size - 10) + "px" : font_size + "px"
      },
      subs: options
    };
  }

  /**
   * Creates a radio selector group. The settings are as follows:
   *
   * float - Can be "left", "right", or "none".
   * width - The width of the radio selector.
   * clear - Whether to break floating. Can be "left", "right", "both", or "none".
   *
   * @param id The ID of the radio selector.
   * @param name The name of the radio selector.
   * @param items A hash of items with key/value pair as label/name.
   * @param settings The settings associated with the radio control.
   * @return A layout tree for the radio selector.
   */
  Make_Radio_Selector(id, name, items, settings) {
    let title = this.Capitalize(name);
    let radio_box = {
      id: id + "_radio_box",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "margin": "0",
        "margin-bottom": "10px",
        "padding": "0",
        "position": "static",
        "height": "auto",
        "margin-top": "10px",
        "float": settings["float"] || "none",
        "width": settings["width"] || "auto",
        "clear": settings["clear"] || "none"
      },
      subs: [
        {
          id: id + "_radio_box_label",
          type: "div",
          text: "#" + title + "#",
          css: {
            "font-size": "18px",
            "margin-bottom": "4px"
          }
        }
      ]
    };
    for (let label in items) {
      let key = items[label];
      radio_box.subs.push({
        id: id + "_radio_button_" + key,
        type: "input",
        attrib: {
          type: "radio",
          name: name,
          value: key
        },
        css: {
          "margin": "0",
          "padding": "0",
          "width": "25px",
          "vertical-align": "middle",
          "height": "12px",
          "cursor": Frankus_Get_Image("Cursor.png", true) + ", default"
        }
      },
      {
        id: id + "_radio_label_" + key,
        type: "label",
        text: label,
        attrib: {
          "for": id + "_radio_button_" + key
        },
        css: {
          "font-size": "12px"
        }
      },
      {
        id: id + "_radio_break_" + key,
        type: "br"
      });
    }
    return radio_box;
  }

  /**
   * Creates a new checkbox board control. The following settings apply:
   *
   * float - Set to "left", "right", or "both".
   * clear - Set to "left", "right", "both", or "none".
   * width - The width of the control.
   *
   * @param id The id of the control.
   * @param name The name of the control.
   * @param items The items set up in key/value format with the key being the label and value being the name.
   * @param settings The settings hash to apply to the control.
   * @return The object dom tree for the control.
   */
  Make_Checkbox_Board(id, name, items, settings) {
    let title = this.Capitalize(name);
    let checkbox_board = {
      id: id + "_checkbox_board",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "margin": "0",
        "margin-bottom": "10px",
        "padding": "0",
        "position": "static",
        "height": "auto",
        "margin-top": "10px",
        "float": settings["float"] || "none",
        "width": settings["width"] || "auto",
        "clear": settings["clear"] || "none"
      },
      subs: [
        {
          id: id + "_checkbox_board_label",
          type: "div",
          text: "#" + title + "#",
          css: {
            "font-size": "18px",
            "margin-bottom": "4px"
          }
        }
      ]
    };
    for (let label in items) {
      let key = items[label];
      checkbox_board.subs.push({
        id: id + "_checkbox_button_" + key,
        type: "input",
        attrib: {
          type: "checkbox",
          name: name,
          value: key
        },
        css: {
          "margin": "0",
          "padding": "0",
          "width": "25px",
          "vertical-align": "middle",
          "height": "12px",
          "cursor": Frankus_Get_Image("Cursor.png", true) + ", default"
        }
      },
      {
        id: id + "_checkbox_label_" + key,
        type: "label",
        text: label,
        attrib: {
          "for": id + "_checkbox_button_" + key
        },
        css: {
          "font-size": "12px"
        }
      },
      {
        id: id + "_checkbox_break_" + key,
        type: "br"
      });
    }
    return checkbox_board;
  }

  /**
   * Creates a loading sign.
   */
  Make_Loading_Sign() {
    return {
      id: this.entity.id + "_loading_sign",
      type: "canvas",
      css: {
        "position": "absolute",
        "left": "0",
        "top": "0",
        "right": "0",
        "bottom": "0",
        "margin": "auto",
        "width": "391px",
        "height": "83px",
        "background-image": Frankus_Get_Image("Loading.png", true),
        "display": "none"
      }
    };
  }

  /**
   * Creates a saving sign.
   */
  Make_Saving_Sign() {
    return {
      id: this.entity.id + "_saving_sign",
      type: "div",
      css: {
        "position": "absolute",
        "left": "0",
        "top": "0",
        "right": "0",
        "bottom": "0",
        "margin": "auto",
        "width": "391px",
        "height": "83px",
        "background-image": Frankus_Get_Image("Saving.png", true),
        "display": "none"
      }
    };
  }

  /**
   * Turns the loading sign on or off.
   * @param on If set to true then the sign appears, otherwise it doesn't.
   */
  Toggle_Loading_Sign(on) {
    this.elements[this.entity.id + "_loading_sign"].style.display = (on) ? "block" : "none";
  }

  /**
   * Turns the saving sign on or off.
   * @param on If set to true then the sign appears, otherwise it doesn't.
   */
  Toggle_Saving_Sign(on) {
    this.elements[this.entity.id + "_saving_sign"].style.display = (on) ? "block" : "none";
  }

  /**
   * Initializes the loading click handler.
   */
  Init_Loading_Click() {
    let self = this;
    this.elements[this.entity.id + "_loading_sign"].addEventListener("click", function(event) {
      self.elements[self.entity.id + "_loading_sign"].style.display = "none";
    }, false);
  }

  /**
   * Initializes the saving click handler.
   */
  Init_Saving_Click() {
    let self = this;
    this.elements[this.entity.id + "_saving_sign"].addEventListener("click", function(event) {
      self.elements[self.entity.id + "_saving_sign"].style.display = "none";
    }, false);
  }

  /**
   * Removes the elements inside of the container.
   * @param container The container with the elements.
   */
  Remove_Elements(container) {
    while (container.childNodes.length > 0) {
      let element = container.childNodes[0];
      this.Remove_Element(element, container);
    }
  }
  
  /**
   * Removes an element and it's children.
   * @param element The element.
   * @param container The container of the element.
   */
  Remove_Element(element, container) {
    let id = element.id;
    // Remove child nodes of item, if any.
    this.Remove_Elements(element);
    container.removeChild(element);
    // Remove element reference for garbage collection.
    if (this.elements[id]) {
      delete this.elements[id];
    }
  }

}

// =============================================================================
// Frankus Field
// =============================================================================

/**
 * A field component is a field on a form like a text input. The following
 * properties can be set:
 *
 * - type - The type of field. Like "password" or "text".
 * - label - The text displayed in the field by default.
 * - border - The border around the field.
 * - fg-color - The text color.
 * - bg-color - The background color.
 * - font - The font used.
 * - size - The size of the text.
 */
class frankusField extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "margin": "0",
        "padding": "0",
        "border": "0",
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px"
      },
      subs: [
        {
          id: this.entity.id + "_field",
          type: "input",
          attrib: {
            type: this.settings["type"] || "text",
            placeholder: this.settings["label"] || ""
          },
          css: {
            "width": "calc(100% - 8px)",
            "height": "calc(100% - 8px)",
            "padding": "2px",
            "margin": "0",
            "margin-left": "1px",
            "margin-top": "1px",
            "border": this.settings["border"] || "1px solid silver",
            "color": this.settings["fg-color"] || "black",
            "background-color": this.settings["bg-color"] || "white",
            "font-family": this.settings["font"] || "Regular, sans-serif",
            "font-size": String(this.settings["size"] || (this.entity.height - 10)) + "px",
            "cursor": Frankus_Get_Image("Cursor.png", true) + ", default"
          }
        }
      ]
    }, this.container);
  }

  /**
   * Gets the value from a field.
   * @return The field value.
   */
  Get_Value() {
    return this.elements[this.entity.id + "_field"].value;
  }

  /**
   * Sets a field value.
   * @param value The value of the field to set.
   */
  Set_Value(value) {
    this.elements[this.entity.id + "_field"].value = value;
  }

}

// =============================================================================
// Frankus Panel
// =============================================================================

/**
 * A panel is a small box where text can be displayed. The properties are:
 *
 * - label - The text to be displayed.
 * - fg-color - The text color.
 * - bg-color - The background color.
 * - font - The font used.
 * - size - The size of the text.
 * - align - How to align the text in the panel.
 */
class frankusPanel extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let padding = parseInt(this.settings["padding"]) || 2;
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"] || "",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": String(this.entity.width - (padding * 2)) + "px",
        "height": (this.entity.height - (padding * 2)) + "px",
        "background-color": this.settings["bg-color"] || "white",
        "color": this.settings["fg-color"] || "black",
        "font-family": this.settings["font"] || "Regular, sans-serif",
        "font-size": String(this.settings["size"] || 16) + "px",
        "line-height": String(this.entity.height - (padding * 2)) + "px",
        "text-align": this.settings["align"] || "left",
        "padding": padding + "px"
      }
    }, this.container);
  }

}

// =============================================================================
// Frankus Box
// =============================================================================

/**
 * A box is like a panel but can be sized in height. The properties are:
 *
 * - label - The text to be displayed.
 * - fg-color - The text color.
 * - bg-color - The background color.
 * - font - The font used.
 * - size - The size of the text.
 * - align - How to align the text in the panel.
 */
class frankusBox extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let center_vertical = (this.settings["center-vertical"] == "on") ? this.entity.height + "px" : "100%";
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"] || "",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "background-color": this.settings["bg-color"] || "white",
        "color": this.settings["fg-color"] || "black",
        "text-align": this.settings["align"] || "left",
        "line-height": center_vertical,
        "font-family": this.settings["font"] || "Regular, sans-serif",
        "font-size": String(this.settings["size"] || 16) + "px"
      }
    }, this.container);
  }

}

// =============================================================================
// Frankus Button
// =============================================================================

/**
 * This is a rectangular click button. The properties are:
 *
 * - fg-color - The color of the text.
 * - bg-color - The button color.
 * - label - The text to display on the button.
 */
class frankusButton extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"] || "",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "background-color": this.settings["bg-color"] || "blue",
        "color": this.settings["fg-color"] || "white",
        "font-weight": "bold",
        "text-align": "center",
        "line-height": this.entity.height + "px",
        "border-radius": "5px",
        "cursor": Frankus_Get_Image("Cursor.png", true) + ", default",
        "font-size": "16px",
        "font-family": "Regular, sans-serif"
      }
    }, this.container);
  }

  On(name, handler) {
    let self = this;
    this.elements[this.entity.id].addEventListener(name, function(event) {
      // Call handler here.
      handler(self, event);
    }, false);
  }

}

// =============================================================================
// Frankus Select
// =============================================================================

/**
 * Creates a select component. The properties are as follows:
 * - list - The list of options in the select. The list item are separated with a semicolon.
 * - bg_color - The background color.
 * - fg-color - The text color.
 * - border - The border of the select.
 * - font - The font to be used for the options.
 * - size - The size of the font.
 */
class frankusSelect extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.sel_index = -1;
    this.sel_text = "";
    this.Create();
  }

  Create() {
    let list = this.settings["list"];
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "margin": "0",
        "padding": "0"
      },
      subs: [
        {
          id: this.entity.id + "_select",
          type: "select",
          css: {
            "width": "calc(100% - 2px)",
            "height": "calc(100% - 2px)",
            "margin": "0",
            "padding": "2px",
            "margin-left": "1px",
            "margin-top": "1px",
            "background-color": this.settings["bg-color"] || "white",
            "color": this.settings["fg-color"] || "black",
            "border": this.settings["border"] || "1px solid silver",
            "font-family": this.settings["font"] || "Regular, sans-serif",
            "font-size": String(this.settings["size"] || (this.entity.height - 10)) + "px",
            "cursor": Frankus_Get_Image("Cursor.png", true) + ", default"
          }
        }
      ]
    }, this.container);
    // Attach list options.
    if (list != undefined) {
      let options = list.split(/\s*;\s*/);
      let option_count = options.length;
      for (let option_index = 0; option_index < option_count; option_index++) {
        let label = options[option_index].trim();
        let option = new Option(label, label);
        this.elements[this.entity.id + "_select"].add(option);
      }
    }
  }

  On(name, handler) {
    let self = this;
    this.elements[this.entity.id + "_select"].addEventListener(name, function(event) {
      this.sel_index = event.target.selectedIndex;
      this.sel_text = event.target.options[this.sel_index].text;
      handler(self, event);
    }, false);
  }

}

// =============================================================================
// Frankus Edit
// =============================================================================

/**
 * A very basic edit component. The properties are:
 *
 * @see frankusComponent:Make_Button
 */
class frankusEdit extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "margin": "0",
        "padding": "0"
      },
      subs: [
        this.Make_Edit(this.entity.id + "_edit", this.settings)
      ]
    }, this.container);
  }

  /**
   * Gets a value from the edit control.
   * @return The value of the editor.
   */
  Get_Value() {
    return this.elements[this.entity.id + "_edit"].value;
  }

  /**
   * Sets the value of the editor.
   * @param value The value to set the editor to.
   */
  Set_Value(value) {
    this.elements[this.entity.id + "_edit"].value = value;
  }

}

// =============================================================================
// Frankus Checkbox
// =============================================================================

/**
 * A checkbox is an object that can be checked on a form. The settings are
 * as follows:
 *
 * - label - The text to display beside the checkbox.
 * - fg-color - The text color.
 * - bg-color - The background color.
 *
 * A checkbox will have the property #checked#.
 */
class frankusCheckbox extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.checked = false;
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "margin": "0",
        "padding": "0",
        "overflow": "hidden"
      },
      subs: [
        {
          id: this.entity.id + "_checkbox",
          type: "input",
          attrib: {
            type: "checkbox"
          },
          css: {
            "margin": "0",
            "margin-left": "1px",
            "margin-top": "1px",
            "margin-right": "8px",
            "width": "32px",
            "height": "100%",
            "cursor": Frankus_Get_Image("Cursor.png", true) + ", default"
          }
        },
        {
          id: this.entity.id + "_label",
          type: "span",
          text: this.settings["label"] || "",
          css: {
            "font-family": "Regular, sans-serif",
            "font-size": String(this.entity.height - 4) + "px",
            "color": this.settings["fg-color"] || "black",
            "background-color": this.settings["bg-color"] || "white",
            "line-height": this.entity.height + "px",
            "vertical-align": "top"
          }
        }
      ]
    }, this.container);
    // Handle click.
    let self = this;
    this.elements[this.entity.id + "_checkbox"].addEventListener("click", function(event) {
      self.checked = event.target.checked;
    }, false);
  }

  /**
   * Sets the checked state of the checkbox.
   * @param checked If set to true then the checkbox is 
   */
  Set_Checked(checked) {
    this.checked = checked;
    this.elements[this.entity.id + "_checkbox"].checked = checked;
  }

}

// =============================================================================
// Frankus Radio Button
// =============================================================================

/**
 * A radio object similar to a checkbox. The settings are as follows:
 *
 * - label - The text to display beside the checkbox.
 * - fg-color - The color of the text.
 * - bg-color - The background color.
 *
 * A radio button will have the property #checked#.
 */
class frankusRadio extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.checked = false;
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "margin": "0",
        "padding": "0"
      },
      subs: [
        {
          id: this.entity.id + "_radio",
          type: "input",
          attrib: {
            type: "radio"
          },
          css: {
            "margin": "0",
            "margin-left": "1px",
            "margin-top": "1px",
            "margin-right": "8px",
            "width": "32px",
            "height": "100%",
            "cursor": Frankus_Get_Image("Cursor.png", true) + ", default"
          }
        },
        {
          id: this.entity.id + "_label",
          type: "span",
          text: this.settings["label"] || "",
          css: {
            "font-family": "Regular, sans-serif",
            "font-size": String(this.entity.height - 4) + "px",
            "color": this.settings["fg-color"] || "black",
            "background-color": this.settings["bg-color"] || "white",
            "line-height": this.entity.height + "px",
            "vertical-align": "top"
          }
        }
      ]
    }, this.container);
    // Handle click.
    let self = this;
    this.elements[this.entity.id + "_radio"].addEventListener("click", function(event) {
      self.checked = event.target.checked;
    }, false);
  }

  On(name, handler) {
    let self = this;
    this.elements[this.entity.id + "_radio"].addEventListener(name, function(event) {
      handler(self, event);
    }, false);
  }

  /**
   * Sets the checked state of the radio button.
   * @param checked True if checked, false otherwise.
   */
  Set_Checked(checked) {
    this.elements[this.entity.id + "_radio"].checked = checked;
  }

}

// =============================================================================
// Frankus Wiki
// =============================================================================

/**
 * A wiki can display and edit markdown. The markdown is sent to the server
 * via a passcode. The properties are as follows:
 *
 * - fg-color - The text color.
 * - bg-color - The background color.
 * - border - The border around the display.
 * - font - The display font.
 * - size - The size of the display font.
 * - file - The file to load the wiki from.
 *
 * @see frankusComponent:Make_Edit
 */
class frankusWiki extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px"
      },
      subs: [
        this.Make_Form(this.entity.id + "_form", [
          this.Make_Edit(this.entity.id, this.settings),
          this.Make_Button(this.entity.id + "_save", {
            "right": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Save",
            "bg-color": "lightgreen",
            "opacity": "0.8"
          }),
          this.Make_Button(this.entity.id + "_cancel", {
            "right": 16,
            "top": 5,
            "width": 64,
            "height": 32,
            "label": "Cancel",
            "bg-color": "lightblue",
            "opacity": "0.8"
          })
        ]),
        {
          id: this.entity.id + "_display",
          type: "div",
          css: {
            "position": "absolute",
            "left": "1px",
            "top": "1px",
            "width": "calc(100% - 8px)",
            "height": "calc(100% - 8px)",
            "padding": "2px",
            "font-family": this.settings["font"] || "Regular, sans-serif",
            "font-size": String(this.settings["size"] || 16) + "px",
            "color": this.settings["fg-color"] || "black",
            "background-color": this.settings["bg-color"] || "white",
            "overflow": "scroll",
            "border": this.settings["border"] || "1px solid silver"
          }
        },
        this.Make_Button(this.entity.id + "_edit", {
          "right": 16,
          "bottom": 5,
          "width": 64,
          "height": 32,
          "label": "Edit",
          "opacity": 0.8,
          "bg-color": "lightblue",
          "opacity": "0.8"
        }),
        this.Make_Loading_Sign(),
        this.Make_Saving_Sign()
      ]
    }, this.container);
    this.Init_Loading_Click();
    this.Init_Saving_Click();
    // Load from file if specified.
    if (this.settings["file"]) {
      this.Load(this.settings["file"]);
    }
    let self = this;
    this.elements[this.entity.id + "_edit"].addEventListener("click", function(event) {
      self.Hide(self.entity.id + "_edit");
      self.Hide(self.entity.id + "_display");
      self.elements[self.entity.id].focus();
      self.elements[self.entity.id].setSelectionRange(0, 0);
    }, false);
    this.elements[this.entity.id + "_save"].addEventListener("click", function(event) {
      self.elements[self.entity.id + "_display"].innerHTML = Frankus_Compile_Markdown(self.elements[self.entity.id].value);
      self.Load_Wiki_Images();
      self.elements[self.entity.id + "_display"].scrollTop = 0;
      self.Show(self.entity.id + "_edit");
      self.Show(self.entity.id + "_display");
      // Save out to a file if specified.
      if (self.settings["file"]) {
        self.Toggle_Saving_Sign(true);
        let save_file = new frankusFile("Wiki/" + self.settings["file"]);
        save_file.data = self.elements[self.entity.id].value;
        save_file.on_write = function() {
          self.Toggle_Saving_Sign(false);
        };
        save_file.Write();
      }
    }, false);
    this.elements[this.entity.id + "_cancel"].addEventListener("click", function(event) {
      self.Show(self.entity.id + "_edit");
      self.Show(self.entity.id + "_display");
      self.elements[self.entity.id + "_display"].scrollTop = 0;
    }, false);
  }

  /**
   * Loads the wiki from a file and displays the contents.
   * @param file The file to load the wiki from.
   */
  Load(file) {
    this.settings["file"] = file;
    let self = this;
    this.Toggle_Loading_Sign(true);
    let wiki_file = new frankusFile("Wiki/" + file + ".txt");
    wiki_file.on_read = function() {
      self.elements[self.entity.id + "_display"].innerHTML = Frankus_Compile_Markdown(wiki_file.data);
      self.Load_Wiki_Images();
      self.elements[self.entity.id].value = wiki_file.data; // We need to load the edit control too.
      self.elements[self.entity.id + "_display"].scrollTop = 0;
      self.Toggle_Loading_Sign(false);
    };
    wiki_file.on_not_found = function() {
      self.elements[self.entity.id + "_display"].innerHTML = "";
      self.elements[self.entity.id].value = "";
      self.elements[self.entity.id + "_display"].scrollTop = 0;
      self.Toggle_Loading_Sign(false);
    };
    wiki_file.Read();
  }

  /**
   * Sets the file to save to.
   * @param file The file to save to.
   */
  Set_File(file) {
    this.settings["file"] = file;
  }

  /**
   * Loads a wiki document from an external file.
   * @param name The name of the file to load from. 
   */
  Load_External(name) {
    let self = this;
    this.Toggle_Loading_Sign(true);
    let wiki_file = new frankusFile("Wiki/" + name + ".txt");
    wiki_file.on_read = function() {
      self.elements[self.entity.id + "_display"].innerHTML = Frankus_Compile_Markdown(wiki_file.data);
      self.Load_Wiki_Images();
      self.elements[self.entity.id].value = wiki_file.data; // We need to load the edit control too.
      self.elements[self.entity.id + "_display"].scrollTop = 0;
      self.Toggle_Loading_Sign(false);
    };
    wiki_file.on_not_found = function() {
      self.elements[self.entity.id + "_display"].innerHTML = "";
      self.elements[self.entity.id].value = "";
      self.elements[self.entity.id + "_display"].scrollTop = 0;
      self.Toggle_Loading_Sign(false);
    };
    wiki_file.Read();
  }

  /**
   * Loads all images of the wiki. Focuses on Frankus pictures.
   */
  Load_Wiki_Images() {
    let container = this.elements[this.entity.id + "_display"];
    let images = container.getElementsByTagName("img");
    let image_count = images.length;
    for (let image_index = 0; image_index < image_count; image_index++) {
      let image = images[image_index];
      image.onload = function(event) {
        let img = event.target;
        if (img.width > container.clientWidth) {
          img.setAttribute("class", "Wiki_Image");
          img.frankus_resizable = true;
        }
      };
    }
  }

  /**
   * Prints the contents of the wiki to a window.
   */
  Print() {
    let wiki_win = window.open(frankus_http + location.host + "/Print.html");
    let wiki_disp = this.elements[this.entity.id + "_display"];
    wiki_win.addEventListener("load", function(event) {
      let body = wiki_win.document.body;
      body.innerHTML = wiki_disp.innerHTML;
    });
  }

}

// =============================================================================
// Frankus Picture
// =============================================================================

/**
 * A static picture to place on a web page. The options are as follows:
 *
 * image - The file to load the picture from.
 * root - Where to load the picture from.
 */
class frankusPicture extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.root = "Images";
    this.Create();
  }

  Create() {
    this.canvas = this.Create_Element({
      id: this.entity.id,
      type: "canvas",
      attrib: {
        width: this.entity.width - 2,
        height: this.entity.height - 2
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      }
    }, this.container);
    this.surface = this.canvas.getContext("2d");
    if (this.settings["root"]) {
      this.Change_Image_Root(this.settings["root"]);
    }
    if (this.settings["image"]) {
      this.Load(this.settings["image"]);
    }
    else {
      this.Output_Error("No image loaded.");
    }
  }

  /**
   * Outputs an error to the image.
   * @param message The error message.
   */
  Output_Error(message) {
    this.surface.save();
    this.surface.font = "12px Regular";
    this.surface.fillStyle = "red";
    this.surface.fillText(message, 0, 12);
    this.surface.restore();
  }

  /**
   * Clears out the picture.
   */
  Clear() {
    this.surface.save();
    this.surface.fillStyle = "white";
    this.surface.fillRect(0, 0, this.entity.width - 2, this.entity.height - 2);
    this.surface.restore();
  }

  /**
   * Loads up a picture.
   * @param name The name of the picture to load. 
   */
  Load(name) {
    let image = new Image();
    let self = this;
    image.onload = function() {
      self.Clear();
      self.surface.drawImage(image, 0, 0);
    };
    image.onerror = function() {
      self.Output_Error("No image loaded.");
    };
    image.src = this.root + "/" + name;
  }

  /**
   * Changes the image root to a different location.
   * @param folder The root folder to load the image from.
   */
  Change_Image_Root(folder) {
    this.root = folder;
  }

}

// =============================================================================
// Frankus Menu
// =============================================================================

/**
 * A side menu component. Items are displayed from top down and a scrollbar is
 * present in the menu. Each menu item is separated by a semicolon. Each item
 * consists of a pair specifying the label and image respectively. A menu item
 * can have either text or an image.
 *
 * Properties are as follows:
 *
 * - items - The menu items with each separated by a semicolon.
 * - height - The height of each menu item.
 * - fg-color - The color of the font.
 * - bg-color - The background color.
 * - highlight-color - The color of the menu item selected.
 * - file - The file with the items to load.
 * - filter - If set to on then a filter is shown.
 */
class frankusMenu extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.item_selected = "";
    this.handler = null;
    this.sel_text = "";
    this.items = [];
    this.timer = null;
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id + "_menu_area",
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        this.Make_Form(this.entity.id + "_form", [
          this.Make_Edit(this.entity.id + "_editor", this.settings),
          this.Make_Button(this.entity.id + "_save", {
            "left": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Save",
            "bg-color": "lightgreen",
            "opacity": "0.5"
          }),
          this.Make_Button(this.entity.id + "_cancel", {
            "right": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Cancel",
            "bg-color": "lightblue",
            "opacity": "0.5"
          })
        ]),
        {
          id: this.entity.id,
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": (this.settings["filter"] == "on") ? "calc(100% - 24px)" : "100%",
            "overflow-y": "scroll",
            "background-color": this.settings["bg-color"] || "white"
          }
        },
        this.Make_Button(this.entity.id + "_edit", {
          "right": 16,
          "bottom": (this.settings["filter"] == "on") ? 29 : 5,
          "width": 64,
          "height": 32,
          "label": "Edit",
          "bg-color": "lightgreen",
          "opacity": "0.5"
        }),
        {
          id: this.entity.id + "_search_area",
          type: "div",
          css: {
            "width": "100%",
            "height": "24px",
            "position": "absolute",
            "left": "0",
            "bottom": "0",
            "background-color": "white",
            "display": (this.settings["filter"] == "on") ? "block": "none"
          },
          subs: [
            this.Make_Form(this.entity.id + "_search_form", [
              this.Make_Field(this.entity.id + "_search", {
                "type": "text",
                "fg-color": "black",
                "bg-color": "white",
                "height": 24,
                "label": "Search terms."
              })
            ])
          ]
        }
      ]
    }, this.container);
    // Set up handlers for buttons.
    let self = this;
    this.elements[this.entity.id + "_edit"].addEventListener("click", function(event) {
      self.Hide(self.entity.id + "_edit");
      self.Hide(self.entity.id);
      self.Hide(self.entity.id + "_search_area");
      self.elements[self.entity.id + "_editor"].focus();
      self.elements[self.entity.id + "_editor"].setSelectionRange(0, 0);
    }, false);
    this.elements[this.entity.id + "_save"].addEventListener("click", function(event) {
      self.Show(self.entity.id + "_edit");
      self.Show(self.entity.id);
      if (self.settings["filter"] == "on") {
        self.Show(self.entity.id + "_search_area");
      }
      let items = Frankus_Split(self.elements[self.entity.id + "_editor"].value);
      self.items = items.slice(0);
      self.Load_Menu(items, self.elements[self.entity.id]);
      if (self.settings["file"]) {
        let save_file = new frankusFile("Menu/" + self.settings["file"]);
        save_file.data = self.elements[self.entity.id + "_editor"].value;
        save_file.Write();
      }
    }, false);
    this.elements[this.entity.id + "_cancel"].addEventListener("click", function(event) {
      self.Show(self.entity.id + "_edit");
      self.Show(self.entity.id);
      if (self.settings["filter"] == "on") {
        self.Show(self.entity.id + "_search_area");
      }
    }, false);
    this.elements[this.entity.id + "_search"].addEventListener("keydown", function(event) {
      if (self.timer) {
        clearTimeout(self.timer);
      }
      self.timer = setTimeout(function() {
        let items = self.Search_Menu(self.elements[self.entity.id + "_search"].value);
        self.Load_Menu(items, self.elements[self.entity.id]);
        self.timer = null; // Make timer free.
      }, 500);
    }, false);
    if (this.settings["items"]) {
      let items = this.settings["items"].split(/\s*;\s*/);
      this.items = items.slice(0);
      this.Load_Menu(items, this.elements[this.entity.id]);
      // Set editor data.
      this.elements[this.entity.id + "_editor"].value = items.join("\n");
    }
    else if (this.settings["file"]) {
      let menu_file = new frankusFile("Menu/" + this.settings["file"]);
      menu_file.on_read = function() {
        let items = menu_file.lines;
        self.items = items.slice(0);
        self.Load_Menu(items, self.elements[self.entity.id]);
        self.elements[self.entity.id + "_editor"].value = items.join("\n");
      };
      menu_file.Read();
    }
  }

  /**
   * Internal routine to load the menu. It will replace the menu with new items.
   * @param items All items to be loaded as an array.
   * @param container The container to load the menu in.
   */
  Load_Menu(items, container) {
    this.item_selected = ""; // Clear out selected item.
    this.Remove_Elements(container);
    // Format for items:
    //
    // label:image
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let options = item.split(/\s*\:\s*/);
      let label = options[0];
      let image = options[1];
      let layout = this.Create_Element({
        id: this.entity.id + "_item_" + item_index,
        text: label,
        type: "div",
        css: {
          "width": "calc(100% - 8px)",
          "height": "calc(" + (this.settings["height"] || 24) + "px - 8px)",
          "overflow": "hidden",
          "padding": "4px",
          "cursor": String(Frankus_Get_Image("Cursor.png", true) + ", default"),
          "line-height": "calc(" + (this.settings["height"] || 24) + "px - 8px)",
          "font-family": "Regular, sans-serif",
          "font-size": String((this.settings["height"] || 24) - 8) + "px",
          "color": this.settings["fg-color"] || "black",
          "background-image": (image.length > 0) ? Frankus_Get_Image(image, true) : "none",
          "background-repeat": "no-repeat",
          "background-color": this.settings["bg-color"] || "transparent",
          "overflow": "hidden",
          "text-indent": (image.length > 0) ? String((this.settings["height"] || 24) + "px") : "0"
        }
      }, container);
      let self = this;
      this.elements[this.entity.id + "_item_" + item_index].addEventListener("click", function(event) {
        let name = event.target.frankus_id;
        // Highlight the menu item to show position.
        if (self.item_selected.length > 0) {
          self.Change_Color(self.item_selected, self.settings["bg-color"] || "transparent");
        }
        self.Change_Color(name, self.settings["highlight-color"] || "lightblue");
        self.item_selected = name;
        self.sel_text = event.target.innerHTML;
        if (self.handler) {
          self.handler(self, event);
        }
      }, false);
    }
  }

  /**
   * Searches a menu and returns only the items in the search.
   * @param search The search string.
   * @return The menu items to display.
   */
  Search_Menu(search) {
    let items = [];
    if (search.length > 0) {
      let terms = search.split(/\s+/);
      let search_exp = new RegExp(terms.join("|"), "i");
      let item_count = this.items.length;
      for (let item_index = 0; item_index < item_count; item_index++) {
        let item = this.items[item_index];
        if (item.match(search_exp)) {
          items.push(item);
        }
      }
    }
    else {
      items = this.items.slice(0);
    }
    return items;
  }

  /**
   * You pass in the handler here. To get the selected item you can either use
   * the component property #sel_text# or #item_selected#. With #item_selected#
   * you will access item menu item by number. The item selected is specified as
   * #<component_id>_item_<item_index>#.
   */
  On(name, handler) {
    this.handler = handler;
  }

  /**
   * Loads a menu from an external file.
   * @param name The name of the file to load the menu from.
   */
  Load_External(name) {
    let self = this;
    let menu_file = new frankusFile("Menu/" + name + ".txt");
    menu_file.on_read = function() {
      let items = menu_file.lines;
      self.items = items.slice(0);
      self.Load_Menu(items, self.elements[self.entity.id]);
      self.elements[self.entity.id + "_editor"].value = items.join("\n");
    };
    menu_file.Read();
  }

  /**
   * Loads a menu from a list.
   * @param list The list of menu items in menu format. 
   */
  Load_From_List(list) {
    this.items = list.slice(0);
    this.Load_Menu(list, this.elements[this.entity.id]);
    this.elements[this.entity.id + "_editor"].value = list.join("\n");
  }

  /**
   * Saves the menu list to a file.
   * @param name The name of the file to save to.
   */
  Save(name) {
    let save_file = new frankusFile("Menu/" + name + ".txt");
    save_file.data = this.elements[this.entity.id + "_editor"].value;
    save_file.Write();
  }

  /**
   * Adds an item to the menu.
   * @param item The item to add in menu format. 
   */
  Add_Item(item) {
    this.items.push(item);
    this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
    this.Load_Menu(this.items, this.elements[this.entity.id]);
  }

  /**
   * Removes an item given the index.
   * @param index The index of the item. 
   */
  Remove_Item(index) {
    if (this.items[index] != undefined) {
      this.items.splice(index, 1);
      this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
      this.Load_Menu(this.items, this.elements[this.entity.id]);
    }
  }

  /**
   * Gets the index of the selected item.
   * @return The index of the selected item.
   */
  Get_Selected_Index() {
    let index = -1;
    if (this.item_selected.length > 0) {
      index = parseInt(this.item_selected.split(/_item_/).pop());
    }
    return index;
  }

  /**
   * Clears out the menu.
   */
  Clear() {
    this.items = [];
    this.elements[this.entity.id + "_editor"].value = "";
    this.Load_Menu(this.items, this.elements[this.entity.id]);
  }

  /**
   * Updates an item by index.
   * @param value The menu item value.
   * @param index The item index.
   */
  Update_Item(value, index) {
    if (this.items[index] != undefined) {
      this.items[index] = value;
      this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
      this.Load_Menu(this.items, this.elements[this.entity.id]);
    }
  }

}

// =============================================================================
// Frankus Toolbar
// =============================================================================

/**
 * A toolbar consists of a group a icons going out to the side. It is a graphical
 * menu. The data is formatted like in a menu.
 * @see frankusMenu:constructor
 *
 * Properties are as follows:
 *
 * - items - The menu items.
 * - file - The file to load the items from. The items are line separated.
 */
class frankusToolbar extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.handler = null;
    this.sel_text = "";
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "overflow-y": "scroll"
      }
    }, this.container);
    if (this.settings["items"]) {
      let items = this.settings["items"].split(/\s*;\s*/);
      this.Load_Toolbar(items, layout);
    }
    else if (this.settings["file"]) {
      let self = this;
      let tool_file = new frankusFile("Toolbar/" + this.settings["file"]);
      tool_file.on_read = function() {
        let items = tool_file.lines;
        self.Load_Toolbar(items, layout);
      };
      tool_file.Read();
    }
  }

  /**
   * Loads the toolbar with a list of items.
   * @param items An array of pairs to load. Format is image:label.
   * @param container The container to load the items into.
   */
  Load_Toolbar(items, container) {
    // Item Format:
    //
    // image:label
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let options = item.split(/\s*:\s*/);
      let image = options[0];
      let label = options[1];
      let layout = this.Create_Element({
        id: this.entity.id + "_tool_" + item_index,
        type: "div",
        attrib: {
          title: label
        },
        css: {
          "width": String(this.entity.height - 2) + "px",
          "height": String(this.entity.height - 2) + "px",
          "background-image": Frankus_Get_Image(image, true),
          "background-repeat": "no-repeat",
          "background-size": String(this.entity.height - 2) + "px " + String(this.entity.height - 2) + "px",
          "cursor": String(Frankus_Get_Image("Cursor.png", true) + ", default"),
          "margin-right": String(this.settings["spacing"] || 4) + "px",
          "float": "left"
        }
      }, container);
      // Create click handler.
      let self = this;
      this.elements[this.entity.id + "_tool_" + item_index].addEventListener("click", function(event) {
        let name = event.target.frankus_id;
        self.sel_text = self.elements[name].title;
        if (self.handler) {
          self.handler(self, event);
        }
      }, false);
    }
  }

  /**
   * @see frankusMenu:On
   *
   * #Note:# Only the selected text from the label is set.
   */
  On(name, handler) {
    this.handler = handler;
  }

}

// =============================================================================
// Frankus Image Button
// =============================================================================

/**
 * This is a button with an image as a background. The properties are as
 * follows:
 *
 * - label - The text to display on the button.
 * - image - The file to load the button image from.
 * - hover - The hover image which is optional.
 * - link - The page to go to when clicked.
 * - font - The font to use for the button.
 * - size - The size of the font in pixels.
 * - color - The color of the label.
 * - popup - The text to display on the hover popup.
 * - orientation - Can be set to "down" to display popup under button.
 * - links - A list of links to display in drop menu. Also affected by orientation.
 */
class frankusImage_Button extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.hov_loaded = false;
    this.handlers = [];
    this.Create();
  }

  Create() {
    let self = this;
    let image = new Image();
    image.onload = function() {
      let layout = self.Create_Element({
        id: self.entity.id,
        type: "div",
        text: self.settings["label"],
        css: {
          "position": "absolute",
          "left": String(self.entity.x + 1) + "px",
          "top": String(self.entity.y + 1) + "px",
          "width": String(self.entity.width - 2) + "px",
          "height": String(self.entity.height - 2) + "px",
          "background-image": Frankus_Get_Image(self.settings["image"], true),
          "background-repeat": "no-repeat",
          "text-align": "center",
          "line-height": String(self.entity.height - 2) + "px",
          "font-family": self.settings["font"] || "Regular, sans-serif",
          "font-size": String(self.settings["size"] || 24) + "px",
          "font-weight": "bold",
          "color": self.settings["color"] || "white",
          "cursor": String(Frankus_Get_Image("Cursor.png", true) + ", default")
        }
      }, self.container);
      let orientation = (self.settings["orientation"] == "down") ? self.settings["orientation"] : "normal";
      let popup = self.Create_Element({
        id: self.entity.id + "_popup",
        type: "div",
        text: self.settings["popup"],
        css: {
          "position": "absolute",
          "left": (orientation == "down") ? String(self.entity.x) + "px" : String(self.entity.x + self.entity.width) + "px",
          "top": (orientation == "down") ? String(self.entity.y + self.entity.height) + "px" : String(self.entity.y) + "px",
          "width": "150px",
          "height": "70px",
          "color": "black",
          "background-color": "white",
          "padding": "4px",
          "border": "1px solid #9DC4CF",
          "border-radius": "10px",
          "overflow": "hidden",
          "font-size": "14px",
          "z-index": "10",
          "display": "none"
        }
      }, self.container);
      let drop_menu = self.Create_Element({
        id: self.entity.id + "_drop_menu",
        type: "div",
        css: {
          "position": "absolute",
          "left": (orientation == "down") ? String(self.entity.x) + "px" : String(self.entity.x + self.entity.width) + "px",
          "top": (orientation == "down") ? String(self.entity.y + self.entity.height) + "px" : String(self.entity.y) + "px",
          "width": "158px",
          "height": "auto",
          "border": "1px solid silver",
          "background-color": "#ECF2FF",
          "display": "none"
        },
        subs: [
          {
            id: self.entity.id + "_menu_title",
            type: "div",
            text: self.settings["label"],
            css: {
              "width": "calc(100% - 8px)",
              "height": "24px",
              "line-height": "24px",
              "font-size": "20px",
              "border": "1px solid silver",
              "margin": "1px",
              "padding": "2px",
              "text-align": "center",
              "font-weight": "bold",
              "background-color": "#BDCEF1"
            }
          }
        ]
      }, self.container);
      // Add links.
      if (self.settings["links"]) {
        let links = self.settings["links"].split(/;/);
        let link_count = links.length;
        for (let link_index = 0; link_index < link_count; link_index++) {
          let pair = links[link_index].split(/:/);
          let label = pair[0];
          let page = pair[1];
          let menu_item = self.Create_Element({
            id: self.entity.id + "_menu_item_" + link_index,
            type: "div",
            text: label,
            css: {
              "width": "calc(100% - 8px)",
              "height": "24px",
              "line-height": "24px",
              "font-size": "16px",
              "border": "1px solid silver",
              "margin": "1px",
              "padding": "2px",
              "text-align": "center"
            }
          }, self.entity.id + "_drop_menu");
          menu_item.frankus_link = page;
          menu_item.addEventListener("click", function(event) {
            let element = event.currentTarget;
            let link = element.frankus_link;
            drop_menu.style.display = "none";
            if (link.match(/^\[[^\]]+\]$/)) {
              let url = frankus_http + link.replace(/^\[([^\]]+)\]$/, "$1");
              window.open(url);
            }
            else {
              if (frankus_layout) {
                frankus_layout.Flip_Page(link);
              }
            }
          }, false);
          menu_item.addEventListener("mouseover", function(event) {
            let element = event.currentTarget;
            element.style.backgroundColor = "yellow";
          }, false);
          menu_item.addEventListener("mouseout", function(event) {
            let element = event.currentTarget;
            element.style.backgroundColor = "transparent";
          }, false);
        }
      }
      let hov_image = null;
      if (self.settings["hover"]) {
        hov_image = new Image();
        hov_image.onload = function() {
          self.hov_loaded = true;
        };
        hov_image.src = Frankus_Get_Image(self.settings["hover"], false);
      }
      layout.addEventListener("mouseover", function(event) {
        if (self.hov_loaded) {
          layout.style.backgroundImage = Frankus_Get_Image(self.settings["hover"], true);
        }
        if (self.settings["popup"]) {
          self.elements[self.entity.id + "_popup"].style.display = "block";
        }
      }, false);
      layout.addEventListener("mouseout", function(event) {
        if (self.hov_loaded) {
          layout.style.backgroundImage = Frankus_Get_Image(self.settings["hover"], true);
        }
        if (self.settings["popup"]) {
          self.elements[self.entity.id + "_popup"].style.display = "none";
        }
      }, false);
      if (self.settings["link"]) {
        layout.addEventListener("click", function(event) {
          if (frankus_layout) {
            frankus_layout.Flip_Page(self.settings["link"]);
          }
        }, false);
      }
      if (self.settings["links"]) {
        layout.addEventListener("click", function(event) {
          let menu = self.elements[self.entity.id + "_drop_menu"];
          if (menu.style.display == "none") {
            menu.style.display = "block";
            if (self.settings["popup"]) {
              self.elements[self.entity.id + "_popup"].style.display = "none";
            }
          }
          else {
            menu.style.display = "none";
          }
        }, false);
      }
      // Process handlers here.
      let handler_count = self.handlers.length;
      for (let handler_index = 0; handler_index < handler_count; handler_index++) {
        let handler = self.handlers[handler_index];
        self.elements[self.entity.id].frankus_handler = handler.handler;
        self.elements[self.entity.id].addEventListener(handler.name, function(event) {
          // Call handler here.
          event.target.frankus_handler(self, event);
        }, false);
      }
    };
    image.onerror = function() {
      let layout = self.Create_Element({
        id: self.entity.id,
        type: "div",
        text: "No image loaded.",
        css: {
          "position": "absolute",
          "left": String(self.entity.x + 1) + "px",
          "top": String(self.entity.y + 1) + "px",
          "width": String(self.entity.width - 2) + "px",
          "height": String(self.entity.height - 2) + "px",
          "line-height": String(self.entity.height - 2) + "px",
          "text-align": "center",
          "color": "black",
          "font-family": "Regular, sans-serif",
          "font-size": "16px"
        }
      }, self.container);
    };
    image.src = Frankus_Get_Image(this.settings["image"], false);
  }

  On(name, handler) {
    if (this.elements[this.entity.id] != undefined) { // Possible cache loading.
      let self = this;
      this.elements[this.entity.id].addEventListener(name, function(event) {
        handler(self, event);
      }, false);
    }
    else { // Network loading.
      this.handlers.push({
        name: name,
        handler: handler
      });
    }
  }

}

// =============================================================================
// Frankus Label
// =============================================================================

/**
 * This is a simple label that you can place anywhere on the screen.
 * The settings are as follows:
 *
 * - label - The text to display on the label.
 * - font - The font to use for the label.
 * - size - The size of the font in pixels.
 * - color - The color of the text on the label.
 * - center - Whether the text is centered. Set to "on" or "off".
 * - bold - Turn on bolding or not. Set to "on" or "off".
 */
class frankusLabel extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"],
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) +"px",
        "font-family": this.settings["font"] || "Regular",
        "font-size": String(this.settings["size"] || 20) + "px",
        "color": this.settings["color"] || "black",
        "text-align": (this.settings["center"] == "off") ? "left" : "center",
        "line-height": String(this.entity.height - 2) + "px",
        "font-weight": (this.settings["bold"] == "on") ? "bold" : "normal"
      }
    }, this.container);
  }

}

// =============================================================================
// Frankus Marquee
// =============================================================================

/**
 * This is a scrolling marquee. The properties are as follows:
 *
 * - delay - The scroll speed delay.
 * - speed - The speed of the scroll.
 * - label - The text to be displayed.
 * - font - The font to be used.
 * - size - The size of the font.
 * - color - The color of the text.
 */
class frankusMarquee extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.timer = null;
    this.pos = this.entity.width;
    this.Create();
  }

  Create() {
    let size = this.settings["size"] || "16";
    let layout = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "overflow": "hidden"
      },
      subs: [
        {
          id: this.entity.id + "_marquee",
          type: "div",
          text: this.settings["label"],
          css: {
            "position": "absolute",
            "left": String(this.entity.width) + "px",
            "top": "1px",
            "width": String(this.settings["label"].length * parseInt(size)) + "px",
            "height": String(this.entity.height - 2) + "px",
            "font-family": this.settings["font"] || "Regular",
            "font-size": size + "px",
            "color": this.settings["color"] || "black"
          }
        }
      ]
    }, this.container);
    // Set up the timer.
    this.Set_Timer();
  }

  /**
   * Sets up the timer and scrolling.
   */
  Set_Timer() {
    let self = this;
    this.timer = setInterval(function() {
      let marquee = self.elements[self.entity.id + "_marquee"];
      self.pos -= self.settings["speed"];
      if (self.pos < -marquee.clientWidth) {
        self.pos = self.entity.width;
      }
      marquee.style.left = String(self.pos) + "px";
    }, this.settings["delay"]);
  }

  /**
   * Pause execution of the timer.
   */
  Pause() {
    clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * Resume the execution of the timer.
   */
  Resume() {
    this.Set_Timer();
  }

}

// =============================================================================
// Frankus Tool Palette
// =============================================================================

/**
 * A tool palette is a collection of tools arranged in rows and columns,
 * like on a grid. The data is formatted like the menu.
 * @see frankusMenu:constructor
 *
 * Properties are as follows:
 *
 * - items - The list of items to appear in the tool palette.
 * - file - A file containing the list of items. These are line separated.
 * - columns - The number of columns.
 * - scale - How big the icons should be. This can be in percent or pixels.
 * - filter - Set this to "on" to turn on the search filter.
 * - labels - Option to turn on labels.
 */
class frankusTool_Palette extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.item_selected = "";
    this.items = [];
    this.timer = null;
    this.sel_text = "";
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id + "_tool_area",
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        this.Make_Form(this.entity.id + "_form", [
          this.Make_Edit(this.entity.id + "_editor", this.settings),
          this.Make_Button(this.entity.id + "_save", {
            "left": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Save",
            "bg-color": "lightgreen",
            "opacity": "0.5"
          }),
          this.Make_Button(this.entity.id + "_cancel", {
            "right": 16,
            "bottom": 5,
            "width": 64,
            "height": 32,
            "label": "Cancel",
            "bg-color": "lightblue",
            "opacity": "0.5"
          })
        ]),
        {
          id: this.entity.id,
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": (this.settings["filter"] == "on") ? "calc(100% - 24px)" : "100%",
            "overflow-y": "scroll",
            "background-color": this.settings["bg-color"] || "white"
          }
        },
        this.Make_Button(this.entity.id + "_edit", {
          "right": 16,
          "bottom": (this.settings["filter"] == "on") ? 29 : 5,
          "width": 64,
          "height": 32,
          "label": "Edit",
          "bg-color": "lightgreen",
          "opacity": "0.5"
        }),
        {
          id: this.entity.id + "_search_area",
          type: "div",
          css: {
            "width": "100%",
            "height": "24px",
            "position": "absolute",
            "left": "0",
            "bottom": "0",
            "background-color": "white",
            "display": (this.settings["filter"] == "on") ? "block": "none"
          },
          subs: [
            this.Make_Form(this.entity.id + "_search_form", [
              this.Make_Field(this.entity.id + "_search", {
                "type": "text",
                "fg-color": "black",
                "bg-color": "white",
                "height": 24,
                "label": "Search terms."
              })
            ])
          ]
        }
      ]
    }, this.container);
    // Set up handlers for buttons.
    let self = this;
    this.elements[this.entity.id + "_edit"].addEventListener("click", function(event) {
      self.Hide(self.entity.id + "_edit");
      self.Hide(self.entity.id);
      self.Hide(self.entity.id + "_search_area");
      self.elements[self.entity.id + "_editor"].focus();
      self.elements[self.entity.id + "_editor"].setSelectionRange(0, 0);
    }, false);
    this.elements[this.entity.id + "_save"].addEventListener("click", function(event) {
      self.Show(self.entity.id + "_edit");
      self.Show(self.entity.id);
      if (self.settings["filter"] == "on") {
        self.Show(self.entity.id + "_search_area");
      }
      let items = Frankus_Split(self.elements[self.entity.id + "_editor"].value);
      self.items = items.slice(0);
      self.Load_Tools(items, self.elements[self.entity.id]);
      if (self.settings["file"]) {
        let save_file = new frankusFile("Toolbar/" + self.settings["file"]);
        save_file.data = self.elements[self.entity.id + "_editor"].value;
        save_file.Write();
      }
    }, false);
    this.elements[this.entity.id + "_cancel"].addEventListener("click", function(event) {
      self.Show(self.entity.id + "_edit");
      self.Show(self.entity.id);
      if (self.settings["filter"] == "on") {
        self.Show(self.entity.id + "_search_area");
      }
      self.elements[self.entity.id + "_editor"].value = self.items.join("\n");
    }, false);
    this.elements[this.entity.id + "_search"].addEventListener("keydown", function(event) {
      if (self.timer) {
        clearTimeout(self.timer);
      }
      self.timer = setTimeout(function() {
        let items = self.Search_Tools(self.elements[self.entity.id + "_search"].value);
        self.Load_Tools(items, self.elements[self.entity.id]);
        self.timer = null; // Make timer free.
      }, 500);
    }, false);
    if (this.settings["items"]) {
      let items = this.settings["items"].split(/\s*;\s*/);
      this.items = items.slice(0);
      this.Load_Tools(items, this.elements[this.entity.id]);
      // Set editor data.
      this.elements[this.entity.id + "_editor"].value = items.join("\n");
    }
    else if (this.settings["file"]) {
      let self = this;
      let tool_file = new frankusFile("Toolbar/" + this.settings["file"]);
      tool_file.on_read = function() {
        let items = tool_file.lines;
        self.items = items.slice(0);
        self.Load_Tools(items, self.elements[self.entity.id]);
        self.elements[self.entity.id + "_editor"].value = items.join("\n");
      };
      tool_file.Read();
    }
  }

  /**
   * Loads the tool palette with the tools.
   * @param items An array of pairs to load. Format is image:label.
   * @param container The container to load the items into.
   */
  Load_Tools(items, container) {
    this.item_selected = "";
    this.Remove_Elements(container);
    // Item Format:
    //
    // image:label
    let entity_w = this.entity.width - 2;
    let width = (this.settings["columns"]) ? Math.floor(entity_w / parseInt(this.settings["columns"])) : Math.floor(entity_w / 2);
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let options = item.split(/\s*:\s*/);
      let image = options[0];
      let label = options[1];
      let layout = this.Create_Element({
        id: this.entity.id + "_tool_" + item_index,
        type: "div",
        attrib: {
          title: label
        },
        css: {
          "width": String(width - 10) + "px",
          "height": String(width- 10) + "px",
          "background-image": Frankus_Get_Image(image, true),
          "background-repeat": "no-repeat",
          "background-position": "center center",
          "background-size": (this.settings["scale"]) ? String(this.settings["scale"]) + " " + String(this.settings["scale"]): "100% 100%",
          "cursor": String(Frankus_Get_Image("Cursor.png", true) + ", default"),
          "float": "left",
          "margin-right": "2px",
          "margin-bottom": "5px",
          "position": "relative"
        },
        subs: [
          {
            id: this.entity.id + "_tool_label_" + item_index,
            type: "div",
            text: label,
            css: {
              "position": "absolute",
              "font-size": "10px",
              "text-align": "center",
              "width": String(width - 10) + "px",
              "height": "12px",
              "bottom": "-8px",
              "display": (this.settings["labels"] == "on") ? "block" : "none",
              "overflow": "hidden"
            }
          }
        ]
      }, container);
      // Create click handler.
      let self = this;
      this.elements[this.entity.id + "_tool_" + item_index].addEventListener("click", function(event) {
        let name = event.target.frankus_id;
        self.sel_text = self.elements[name].title;
        self.item_selected = name;
        if (self.handler) {
          self.handler(self, event);
        }
      }, false);
    }
  }

  /**
   * Searches the tools and returns only the items in the search.
   * @param search The search string.
   * @return The tool items to display.
   */
  Search_Tools(search) {
    let items = [];
    if (search.length > 0) {
      let terms = search.split(/\s+/);
      let search_exp = new RegExp(terms.join("|"), "i");
      let item_count = this.items.length;
      for (let item_index = 0; item_index < item_count; item_index++) {
        let item = this.items[item_index];
        if (item.match(search_exp)) {
          items.push(item);
        }
      }
    }
    else {
      items = this.items.slice(0);
    }
    return items;
  }

  /**
   * @see frankusMenu:On
   *
   * #Note:# Only the selected text from the label is set.
   */
  On(name, handler) {
    this.handler = handler;
  }

  /**
   * Loads a tool palette from an external file.
   * @param name The name of the file to load the tool palette from.
   */
  Load_External(name) {
    let self = this;
    let tool_file = new frankusFile("Toolbar/" + name + ".txt");
    tool_file.on_read = function() {
      let items = tool_file.lines;
      self.items = items.slice(0);
      self.Load_Tools(items, self.elements[self.entity.id]);
      self.elements[self.entity.id + "_editor"].value = items.join("\n");
    };
    tool_file.Read();
  }

  /**
   * Loads a tool palette from a list.
   * @param list The list of tool items in menu format. 
   */
  Load_From_List(list) {
    this.items = list.slice(0);
    this.Load_Tools(list, this.elements[this.entity.id]);
    this.elements[this.entity.id + "_editor"].value = list.join("\n");
  }

  /**
   * Saves the tool palette to a file.
   * @param name The name of the file to save to.
   */
  Save(name) {
    let save_file = new frankusFile("Toolbar/" + name + ".txt");
    save_file.data = this.elements[this.entity.id + "_editor"].value;
    save_file.Write();
  }

  /**
   * Adds an item to the tool palette.
   * @param item The item to add in menu format. 
   */
  Add_Item(item) {
    this.items.push(item);
    this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
    this.Load_Tools(this.items, this.elements[this.entity.id]);
  }

  /**
   * Removes an item given the index.
   * @param index The index of the item. 
   */
  Remove_Item(index) {
    if (this.items[index] != undefined) {
      this.items.splice(index, 1);
      this.elements[this.entity.id + "_editor"].value = this.items.join("\n");
      this.Load_Tools(this.items, this.elements[this.entity.id]);
    }
  }

  /**
   * Gets the index of the selected item.
   * @return The index of the selected item.
   */
  Get_Selected_Index() {
    let index = -1;
    if (this.item_selected.length > 0) {
      index = parseInt(this.item_selected.split(/_tool_/).pop());
    }
    return index;
  }

  /**
   * Clears out the tool palette.
   */
  Clear() {
    this.items = [];
    this.elements[this.entity.id + "_editor"].value = "";
    this.Load_Tools(this.items, this.elements[this.entity.id]);
  }

}

// =============================================================================
// Frankus Grid View
// =============================================================================

/**
 * A grid view is a table-like component which allows values
 * to be entered or selected from various controls.
 *
 * Properties are as follows:
 *
 * - file - A file to load the table from. It is tab delimited. You
 *          can create this file from a spreadsheet.
 * - fg-color - The color of the text in the grid.
 * - bg-color - The background color of the grid.
 *
 * The table data is formatted as follows:
 *
 * - Each cell is tab delimited while rows are delimited by new lines.
 * - Cells may contain a value which can be textual or numeric. If the
 *   value is within brackets then it is editable. Multiple values can
 *   be separated by commas.
 *
 */
class frankusGrid_View extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.row_count = 0;
    this.col_count = 0;
    this.Create();
  }

  Create() {
    let grid_area = this.Create_Element({
      id: this.entity.id + "_grid_area",
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "overflow-y": "scroll",
        "background-color": (this.settings["bg-color"]) ? this.settings["bg-color"] : "silver"
      }
    }, this.container);
    // Load up table.
    if (this.settings["file"]) {
      this.Load_Table(this.settings["file"]);
    }
    else if (this.settings["rows"] && this.settings["columns"]) {
      this.Create_Blank_Table(parseInt(this.settings["rows"]), parseInt(this.settings["columns"]));
    }
  }

  /**
   * Loads a table from a file.
   * @param name The name of the table file to load.
   */
  Load_Table(name) {
    // Now load the new table.
    let self = this;
    let grid_file = new frankusFile("Grid/" + name);
    grid_file.on_read = function() {
      self.Build_View(grid_file.data);
    };
    grid_file.Read();
  }

  /**
   * Creates a blank table of rows and columns.
   * @param rows The number of rows in the table.
   * @param columns The number of columns in the table.
   */
  Create_Blank_Table(rows, columns) {
    let data = [];
    for (let row_index = 0; row_index < rows; row_index++) {
      let cols = [];
      for (let col_index = 0; col_index < columns; col_index++) {
        cols.push("");
      }
      data.push(cols.join("\t"));
    }
    this.Build_View(data.join("\n"));
  }

  /**
   * Gets the value of a cell at a specific coordinate.
   * @param x The column coordinate.
   * @param y The row coordinate.
   * @return The value at the location.
   * @throws An error if the coordinate are invalid.
   */
  Get_Value(x, y) {
    let value = "";
    if (this.elements[this.entity.id + "_cell_field_" + y + "_" + x] != undefined) {
      value = this.elements[this.entity.id + "_cell_field_" + y + "_" + x].value;
    }
    else {
      throw new Error("Invalid coordinates for cell value.");
    }
    return value;
  }

  /**
   * Sets a value to a specific cell given the coordinates.
   * @param x The x coordinate of the cell. 
   * @param y The y coordinate of the cell. 
   * @param value The value to set at the cell.
   * @throws An error if the cell does not exist.
   */
  Set_Value(x, y, value) {
    if (this.elements[this.entity.id + "_cell_field_" + y + "_" + x] != undefined) {
      this.elements[this.entity.id + "_cell_field_" + y + "_" + x].value = value;
    }
    else {
      throw new Error("Invalid coordinates for cell value.");
    }
  }

  /**
   * Gets the tab delimited data from the table.
   * @return The table data string from all the cells.
   */
  Get_Table_Data() {
    let data = [];
    let row_count = this.row_count;
    let col_count = this.col_count;
    for (let row_index = 0; row_index < row_count; row_index++) {
      let row = [];
      for (let col_index = 0; col_index < col_count; col_index++) {
        row.push(this.Get_Value(col_index, row_index));
      }
      data.push(row.join("\t"));
    }
    return data.join("\n");
  }

  /**
   * Sets the data to the existing cells of the table.
   * @param data The tab delimited table data.
   */
  Set_Table_Data(data) {
    let rows = Frankus_Split(data);
    let row_count = (rows.length > this.row_count) ? this.row_count : rows.length;
    this.Clear(); // Clear out old data.
    for (let row_index = 0; row_index < row_count; row_index++) {
      let columns = rows[row_index].split(/\t/);
      let col_count = (columns.length > this.col_count) ? this.col_count : columns.length;
      for (let col_index = 0; col_index < col_count; col_index++) {
        this.Set_Value(col_index, row_index, columns[col_index]);
      }
    }
  }

  /**
   * Clears out the grid view.
   */
  Clear() {
    let row_count = this.row_count;
    let col_count = this.col_count;
    for (let row_index = 0; row_index < row_count; row_index++) {
      for (let col_index = 0; col_index < col_count; col_index++) {
        this.Set_Value(col_index, row_index, "");
      }
    }
  }

  /**
   * Builds a grid view using tab delimited data.
   * @param data The tab delimited table data.
   * @throws An error if the column count is invalid.
   */
  Build_View(data) {
    // Clear out container of any table.
    this.Remove_Elements(this.elements[this.entity.id + "_grid_area"]);
    // Build up grid.
    let rows = Frankus_Split(data);
    let row_count = rows.length;
    this.row_count = row_count; // Record the row count.
    for (let row_index = 0; row_index < row_count; row_index++) {
      let cells = rows[row_index].split(/\t/);
      let cell_count = cells.length;
      if (this.col_count > 0) {
        if (cell_count != this.col_count) {
          throw "Column size is not consistent.";
        }
      }
      this.col_count = cell_count; // Record the cell count.
      let cell_width = 100 / cell_count;
      let row_element = this.Create_Element({
        id: this.entity.id + "_row_" + row_index,
        type: "div",
        css: {
          "width": "calc(100% - 2px)",
          "border": "1px dotted black",
          "border-bottom": (row_index == (row_count - 1)) ? "1px dotted black" : "0",
          "height": "24px"
        }
      }, this.entity.id + "_grid_area");
      for (let cell_index = 0; cell_index < cell_count; cell_index++) {
        let cell = cells[cell_index];
        let cell_element = this.Create_Element({
          id: this.entity.id + "_cell_" + row_index + "_" + cell_index,
          type: "div",
          css: {
            "width": "calc(" + cell_width + "% - 1px)",
            "height": "100%",
            "border-right": (cell_index == (cell_count - 1)) ? "0" : "1px dotted black",
            "float": "left",
            "line-height": "24px",
            "position": "relative"
          },
          subs: [
            this.Make_Form(this.entity.id + "_cell_form_" + row_index + "_" + cell_index, [
              this.Make_Field(this.entity.id + "_cell_field_" + row_index + "_" + cell_index, {
                "type": "text",
                "fg-color": "black",
                "bg-color": "transparent",
                "height": 24,
                "value": cell,
                "border": "none"
              })
            ])
          ]
        }, row_element);
      }
    }
  }

}

// =============================================================================
// Frankus Comic Book Reader
// =============================================================================

/**
 * This component allows comics to be read page by page with the click
 * of a button.
 *
 * Properties are as follows:
 *
 * name - The base name of the comic files. i.e. "Trail_Hogs"
 */
class frankusComic_Reader extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.page_no = 1;
    this.Create();
  }
  
  Create() {
    let page_area = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        {
          id: this.entity.id + "_image",
          type: "img",
          attrib: {
            "width": "100%",
            "height": "100%",
            "src": this.Get_Page_Image()
          },
          css: {
            "width": "100%",
            "height": "100%"
          }
        },
        {
          id: this.entity.id + "_page_no",
          type: "div",
          text: "1",
          css: {
            "position": "absolute",
            "right": "4px",
            "top": "4px",
            "width": "24px",
            "height": "24px",
            "background-color": "black",
            "border-radius": "12px",
            "color": "white",
            "font-size": "12px",
            "text-align": "center",
            "line-height": "24px",
            "font-weight": "bold"
          }
        }
      ]
    }, this.container);
    let self = this;
    this.elements[this.entity.id + "_image"].addEventListener("error", function(event) {
      if (self.page_no > 1) {
        self.Go_To_Page(-1); // Go back to last good page.
      }
    }, false);
    this.elements[this.entity.id + "_image"].addEventListener("load", function(event) {
      // Store page position.
      localStorage.setItem(self.settings["name"] + "_comic_page", self.page_no);
    }, false);
    this.Remember_Page();
  }
  
  /**
   * Remembers the last page you were on and goes to it otherwise
   * it goes to the first page.
   */
  Remember_Page() {
    // Load saved page.
    if (localStorage.getItem(this.settings["name"] + "_comic_page") != null) {
      let page_no = parseInt(localStorage.getItem(this.settings["name"] + "_comic_page"));
      this.Move_To_Page(page_no);
    }
    else {
      this.Move_To_Page(1);
    }
  }
  
  /**
   * Goes to a page forwards or backwards depending on provided
   * value.
   * @param direction 1 or -1 for proper navigation.
   */
  Go_To_Page(direction) {
    this.page_no += direction;
    if (this.page_no < 1) {
      this.page_no = 1;
    }
    this.elements[this.entity.id + "_image"].src = this.Get_Page_Image();
    this.elements[this.entity.id + "_page_no"].innerHTML = this.page_no;
  }
  
  /**
   * Goes directly to a page given the page number.
   * @param page_no The page number to go to.
   */
  Move_To_Page(page_no) {
    this.page_no = parseInt(page_no);
    if (this.page_no < 1) {
      this.page_no = 1;
    }
    this.elements[this.entity.id + "_image"].src = this.Get_Page_Image();
    this.elements[this.entity.id + "_page_no"].innerHTML = this.page_no;
  }
  
  /**
   * Gets the page image.
   * @return The page image file.
   */
  Get_Page_Image() {
    return Frankus_Get_Image(this.settings["name"] + "_Page_" + this.page_no + ".png", false);
  }
  
  /**
   * Sets the name of the comic to load.
   * @param name The name of the comic. This resets the page number.
   */
  Set_Name(name) {
    this.settings["name"] = name;
    this.Remember_Page();
  }

}

// =============================================================================
// Frankus Code Editor
// =============================================================================

/**
 * This is a code editor component, complete with a browser used
 * for Frankus's Code Bank.
 * 
 * Properties are as follows:
 * 
 * - file - A file to load at runtime.
 */
class frankusCode_Editor extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.GRAPHIC_W = 16;
    this.CHAR_W = 8;
    this.CHAR_H = 16;
    this.TAB_CHAR = "  "; // 2 Spaces
    this.lines = [];
    this.cursor_x = 0;
    this.cursor_y = 0;
    this.shift_start = -1;
    this.shift_end = -1;
    this.shift_mode = 0; // Shift key was held down.
    this.columns = 0;
    this.rows = 0;
    this.selection_started = false;
    this.opened_file = "";
    this.code_files = {
      "js": true,
      "cpp": true,
      "hpp": true,
      "h": true,
      "c": true,
      "xml": true,
      "html": true,
      "css": true,
      "script": true,
      "clsh": true,
      "pl": true,
      "sh": true,
      "java": true,
      "json": true,
      "txt": true,
      "init": true,
      "pic": true,
      "ent": true,
      "map": true,
      "bkg": true,
      "scene": true,
      "py": true,
      "bm": true,
      "txt": true,
      "rc": true,
      "bat": true,
      "asm": true,
      "prgm": true,
      "mov": true
    };
    this.selection_start = {
      x: -1,
      y: -1
    };
    this.selection_end = {
      x: -1,
      y: -1
    };
    this.keywords = {
      "clsh": [
        "define",
        "as",
        "label",
        "let",
        "list",
        "alloc",
        "test",
        "set",
        "to",
        "at",
        "move",
        "remark",
        "end",
        "and",
        "or",
        "rem",
        "cat",
        "rand",
        "sin",
        "cos",
        "tan",
        "eq",
        "ne",
        "lt",
        "gt",
        "le",
        "ge",
        "stop",
        "output",
        "call",
        "return",
        "import",
        "var"
      ],
      "script": [
        "define",
        "as",
        "label",
        "let",
        "list",
        "alloc",
        "test",
        "set",
        "to",
        "at",
        "move",
        "remark",
        "end",
        "and",
        "or",
        "rem",
        "cat",
        "rand",
        "sin",
        "cos",
        "tan",
        "eq",
        "ne",
        "lt",
        "gt",
        "le",
        "ge",
        "stop",
        "output",
        "call",
        "return",
        "import",
        "var"
      ],
      "cpp": [
        "alignas",
        "alignof",
        "and",
        "and_eq",
        "asm",
        "atomic_cancel",
        "atomic_commit",
        "atomic_noexcept",
        "auto",
        "bitand",
        "bitor",
        "bool",
        "break",
        "case",
        "catch",
        "char",
        "char8_t",
        "char16_t",
        "char32_t",
        "class",
        "compl",
        "concept",
        "const",
        "consteval",
        "constexpr",
        "constinit",
        "const_cast",
        "continue",
        "co_await",
        "co_return",
        "co_yield",
        "decltype",
        "default",
        "delete",
        "do",
        "double",
        "dynamic_cast",
        "else",
        "enum",
        "explicit",
        "export",
        "extern",
        "false",
        "float",
        "for",
        "friend",
        "goto",
        "if",
        "inline",
        "int",
        "long",
        "mutable",
        "namespace",
        "new",
        "noexcept",
        "not",
        "not_eq",
        "nullptr",
        "operator",
        "or",
        "or_eq",
        "private",
        "protected",
        "public",
        "reflexpr",
        "register",
        "reinterpret_cast",
        "requires",
        "return",
        "short",
        "signed",
        "sizeof",
        "static",
        "static_assert",
        "static_cast",
        "struct",
        "switch",
        "synchronized",
        "template",
        "this",
        "thread_local",
        "throw",
        "true",
        "try",
        "typedef",
        "typeid",
        "typename",
        "union",
        "unsigned",
        "using",
        "virtual",
        "void",
        "volatile",
        "wchar_t",
        "while",
        "xor",
        "xor_eq"
      ],
      "hpp": [
        "alignas",
        "alignof",
        "and",
        "and_eq",
        "asm",
        "atomic_cancel",
        "atomic_commit",
        "atomic_noexcept",
        "auto",
        "bitand",
        "bitor",
        "bool",
        "break",
        "case",
        "catch",
        "char",
        "char8_t",
        "char16_t",
        "char32_t",
        "class",
        "compl",
        "concept",
        "const",
        "consteval",
        "constexpr",
        "constinit",
        "const_cast",
        "continue",
        "co_await",
        "co_return",
        "co_yield",
        "decltype",
        "default",
        "delete",
        "do",
        "double",
        "dynamic_cast",
        "else",
        "enum",
        "explicit",
        "export",
        "extern",
        "false",
        "float",
        "for",
        "friend",
        "goto",
        "if",
        "inline",
        "int",
        "long",
        "mutable",
        "namespace",
        "new",
        "noexcept",
        "not",
        "not_eq",
        "nullptr",
        "operator",
        "or",
        "or_eq",
        "private",
        "protected",
        "public",
        "reflexpr",
        "register",
        "reinterpret_cast",
        "requires",
        "return",
        "short",
        "signed",
        "sizeof",
        "static",
        "static_assert",
        "static_cast",
        "struct",
        "switch",
        "synchronized",
        "template",
        "this",
        "thread_local",
        "throw",
        "true",
        "try",
        "typedef",
        "typeid",
        "typename",
        "union",
        "unsigned",
        "using",
        "virtual",
        "void",
        "volatile",
        "wchar_t",
        "while",
        "xor",
        "xor_eq"
      ],
      "c": [
        "auto",
        "break",
        "case",
        "char",
        "const",
        "continue",
        "default",
        "do",
        "double",
        "else",
        "enum",
        "extern",
        "float",
        "for",
        "goto",
        "if",
        "inline",
        "int",
        "long",
        "register",
        "restrict",
        "return",
        "short",
        "signed",
        "sizeof",
        "static",
        "struct",
        "switch",
        "typedef",
        "union",
        "unsigned",
        "void",
        "volatile",
        "while",
        "_Alignas",
        "_Alignof",
        "_Atomic",
        "_Bool",
        "_Complex",
        "_Generic",
        "_Imaginary",
        "_Noreturn",
        "_Static_assert",
        "_Thread_local"
      ],
      "h": [
        "auto",
        "break",
        "case",
        "char",
        "const",
        "continue",
        "default",
        "do",
        "double",
        "else",
        "enum",
        "extern",
        "float",
        "for",
        "goto",
        "if",
        "inline",
        "int",
        "long",
        "register",
        "restrict",
        "return",
        "short",
        "signed",
        "sizeof",
        "static",
        "struct",
        "switch",
        "typedef",
        "union",
        "unsigned",
        "void",
        "volatile",
        "while",
        "class",
        "public",
        "private",
        "protected",
        "_Alignas",
        "_Alignof",
        "_Atomic",
        "_Bool",
        "_Complex",
        "_Generic",
        "_Imaginary",
        "_Noreturn",
        "_Static_assert",
        "_Thread_local",
        "namespace",
        "bool",
        "virtual"
      ],
      "js": [
        "abstract",
        "arguments",
        "await",
        "boolean",
        "break",
        "byte",
        "case",
        "catch",
        "char",
        "class",
        "const",
        "continue",
        "debugger",
        "default",
        "delete",
        "do",
        "double",
        "else",
        "enum",
        "eval",
        "export",
        "extends",
        "false",
        "final",
        "finally",
        "float",
        "for",
        "function",
        "goto",
        "if",
        "implements",
        "import",
        "in",
        "instanceof",
        "int",
        "interface",
        "let",
        "long",
        "native",
        "new",
        "null",
        "package",
        "private",
        "protected",
        "public",
        "return",
        "short",
        "static",
        "super",
        "switch",
        "synchronized",
        "this",
        "throw",
        "throws",
        "transient",
        "true",
        "try",
        "typeof",
        "var",
        "void",
        "volatile",
        "while",
        "with",
        "yield",
        "self"
      ],
      "py": [
        "and",
        "as",
        "assert",
        "break",
        "class",
        "continue",
        "def",
        "del",
        "elif",
        "else",
        "except",
        "False",
        "finally",
        "for",
        "from",
        "global",
        "if",
        "import",
        "in",
        "is",
        "lambda",
        "None",
        "nonlocal",
        "not",
        "or",
        "pass",
        "raise",
        "return",
        "True",
        "try",
        "while",
        "with",
        "yield"
      ]
    };
    this.key_map = {
      "Space":        "  ", // Space
      "Digit0":       "0)", // Numbers
      "Digit1":       "1!",
      "Digit2":       "2@",
      "Digit3":       "3#",
      "Digit4":       "4$",
      "Digit5":       "5%",
      "Digit6":       "6^",
      "Digit7":       "7&",
      "Digit8":       "8*",
      "Digit9":       "9(",
      "KeyA":         "aA", // Letters
      "KeyB":         "bB",
      "KeyC":         "cC",
      "KeyD":         "dD",
      "KeyE":         "eE",
      "KeyF":         "fF",
      "KeyG":         "gG",
      "KeyH":         "hH",
      "KeyI":         "iI",
      "KeyJ":         "jJ",
      "KeyK":         "kK",
      "KeyL":         "lL",
      "KeyM":         "mM",
      "KeyN":         "nN",
      "KeyO":         "oO",
      "KeyP":         "pP",
      "KeyQ":         "qQ",
      "KeyR":         "rR",
      "KeyS":         "sS",
      "KeyT":         "tT",
      "KeyU":         "uU",
      "KeyV":         "vV",
      "KeyW":         "wW",
      "KeyX":         "xX",
      "KeyY":         "yY",
      "KeyZ":         "zZ",
      "Backquote":    "`~", // Special Characters
      "Minus":        "-_",
      "Equal":        "=+",
      "BracketLeft":  "[{",
      "BracketRight": "]}",
      "Backslash":    "\\|",
      "Semicolon":    ";:",
      "Quote":        "'\"",
      "Comma":        ",<",
      "Period":       ".>",
      "Slash":        "/?"
    };
    this.Create();
  }

  Create() {
    // Add offscreen text element for input. Here so it is not visible.
    let input = this.Create_Element({
      id: this.entity.id + "_text_input_form",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 10) + "px",
        "top": String(this.entity.y + 10) + "px",
        "width": "64px",
        "height": "32px"
      },
      subs: [
        {
          id: this.entity.id + "_text_input",
          type: "textarea",
          attrib: {
            rows: 5,
            cols: 25,
            wrap: "off"
          },
          css: {
            "position": "absolute",
            "width": "64px",
            "height": "32px",
            "cursor": Frankus_Get_Image("Cursor.png", true) + ", default"
          }
        }
      ]
    }, this.container);
    let text_metrics = this.Create_Element({
      id: this.entity.id + "_text_metric",
      type: "canvas",
      attrib: {
        width: 100,
        height: 100
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 10) + "px",
        "top": String(this.entity.y + 10) + "px",
        "width": "100px",
        "height": "100px",
        "color": "transparent"
      }
    }, this.container);
    // Augment character width.
    let text_canvas = text_metrics.getContext("2d");
    text_canvas.font = "16px monospace";
    this.CHAR_W = text_canvas.measureText("X").width;
    // Create the editor layout.
    let edit = this.Create_Element({
      id: this.entity.id + "_border",
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "background-color": "white"
      },
      subs: [
        {
          id: this.entity.id + "_viewport",
          type: "div",
          css: {
            "position": "absolute",
            "left": "4px",
            "top": "4px",
            "width": "calc(100% - 8px)",
            "height": "calc(100% - 8px)",
            "color": "black",
            "background-color": "white",
            "font-family": "monospace",
            "font-size": "16px",
            "white-space": "pre",
            "line-height": "1em",
            "overflow": "hidden"
          }
        },
        {
          id: this.entity.id + "_cursor_area",
          type: "div",
          css: {
            "position": "absolute",
            "left": "4px",
            "top": "4px",
            "width": "calc(100% - 8px)",
            "height": "calc(100% - 8px)",
            "color": "red",
            "background-color": "transparent",
            "font-family": "monospace",
            "font-size": "16px",
            "white-space": "pre",
            "line-height": "1em",
            "overflow": "hidden",
            "opacity": "0.5",
            "cursor": String(Frankus_Get_Image("Lettering.png", true) + ", default")
          }
        },
        this.Make_Loading_Sign(),
        this.Make_Saving_Sign()
      ]
    }, this.container);
    // Resize the viewport.
    this.columns = Math.floor((this.entity.width - 8 - 2) / this.CHAR_W);
    this.rows = Math.floor((this.entity.height - 8 - 2) / this.CHAR_H);
    // Add blank line.
    this.lines.push("");
    // Render this line.
    this.Render();
    // Initialize handlers.
    let self = this;
    this.Init_Loading_Click();
    this.Init_Saving_Click();
    this.elements[this.entity.id + "_cursor_area"].addEventListener("click", function(event) {
      self.elements[self.entity.id + "_text_input"].focus();
    }, false);
    this.elements[this.entity.id + "_cursor_area"].addEventListener("mousedown", function(event) {
      let mouse_x = (event.offsetX != undefined) ? event.offsetX : event.layerX;
      let mouse_y = (event.offsetY != undefined) ? event.offsetY : event.layerY;
      self.selection_start.x = Math.floor(mouse_x / self.CHAR_W);
      self.selection_start.y = Math.floor(mouse_y / self.CHAR_H);
      self.shift_start = self.selection_start.y;
      self.selection_started = true;
    }, false);
    this.elements[this.entity.id + "_cursor_area"].addEventListener("mouseup", function(event) {
      let mouse_x = (event.offsetX != undefined) ? event.offsetX : event.layerX;
      let mouse_y = (event.offsetY != undefined) ? event.offsetY : event.layerY;
      self.selection_end.x = Math.floor(mouse_x / self.CHAR_W);
      self.selection_end.y = Math.floor(mouse_y / self.CHAR_H);
      let selection_width = (self.selection_end.x - self.selection_start.x) + 1;
      let selection_height = (self.selection_end.y - self.selection_start.y) + 1;
      if ((self.selection_start.x != -1) && (self.selection_start.y != -1)) {
        if ((selection_width == 1) && (selection_height == 1)) {
          self.selection_start.x = -1;
          self.selection_start.y = -1;
          // Set cursor coordinates.
          let viewport_coords = self.Get_Viewport_Coords();
          self.cursor_x = viewport_coords.x + self.selection_end.x;
          self.cursor_y = viewport_coords.y + self.selection_end.y;
          self.Validate_Cursor();
        }
        else {
          self.Copy_Selection();
        }
        self.Render();
      }
      self.shift_end = self.selection_end.y;
      self.selection_started = false;
    }, false);
    this.elements[this.entity.id + "_cursor_area"].addEventListener("mousemove", function(event) {
      if (self.selection_started) {
        let mouse_x = (event.offsetX != undefined) ? event.offsetX : event.layerX;
        let mouse_y = (event.offsetY != undefined) ? event.offsetY : event.layerY;
        self.selection_end.x = Math.floor(mouse_x / self.CHAR_W);
        self.selection_end.y = Math.floor(mouse_y / self.CHAR_H);
        if ((self.selection_start.x != -1) && (self.selection_start.y != -1)) {
          self.Render();
        }
      }
    }, false);
    this.elements[this.entity.id + "_cursor_area"].addEventListener("wheel", function(event) {
      let scroll = (event.deltaY != undefined) ? event.deltaY : 0;
      if (scroll < 0) {
        if (self.cursor_y >= self.rows) {
          self.cursor_y -= self.rows; // Scroll one screen up.
        }
      }
      else if (scroll > 0) {
        if (self.cursor_y < (self.lines.length - self.rows)) {
          self.cursor_y += self.rows;
        }
      }
      self.Render();
    }, false);
    this.elements[this.entity.id + "_text_input"].addEventListener("keydown", function(event) {
      let key = event.code;
      if (key == "Enter") { // Return/Enter
        // Count off indenting spaces in previous line.
        let padding = self.lines[self.cursor_y].match(/^\s+/);
        if (!padding) {
          padding = ""; // We need to do self to avoid an issue with arrays not liking NULL values.
        }
        else {
          padding = padding[0];
        }
        // If the cursor is at the beginning of the file insert before otherwise insert after.
        if ((self.cursor_x == 0) && (self.cursor_y == 0)) {
          let before = self.lines.slice(0, self.cursor_y);
          let after = self.lines.slice(self.cursor_y);
          self.lines = before.concat(padding, after);
        }
        else {
          let before = self.lines.slice(0, self.cursor_y + 1);
          let after = self.lines.slice(self.cursor_y + 1);
          self.lines = before.concat(padding, after);
          self.cursor_y++;
        }
        self.cursor_x = padding.length;
      }
      else if (key == "Backspace") { // Backspace
        if ((self.selection_start.x != -1) && (self.selection_start.y != -1)) {
          let number_of_lines = self.lines.length;
          let viewport_coords = self.Get_Viewport_Coords();
          for (let line_y = self.selection_start.y; line_y <= self.selection_end.y; line_y++) {
            if (line_y < number_of_lines) {
              let spaces = self.lines[viewport_coords.y + line_y].substring(0, 2);
              if (spaces == self.TAB_CHAR) { // Don't unindent without spaces.
                self.lines[viewport_coords.y + line_y] = self.lines[viewport_coords.y + line_y].substring(self.TAB_CHAR.length);
              }
            }
          }
          // Deselect the area.
          self.selection_start.x = -1;
          self.selection_start.y = -1;
          self.Render();
        }
        else {
          // Does not delete last character if out of bounds.
          if (self.cursor_x > 0) {
            // Delete
            let before = self.lines[self.cursor_y].slice(0, self.cursor_x - 1);
            let after = self.lines[self.cursor_y].slice(self.cursor_x);
            self.lines[self.cursor_y] = before + after;
            self.cursor_x--;
          }
          else {
            // Take the entire line and move it to the previous line.
            if (self.cursor_y > 0) { // Make sure there are lines.
              let prev_line = self.lines[self.cursor_y];
              // Delete self line.
              let before = self.lines.slice(0, self.cursor_y);
              let after = self.lines.slice(self.cursor_y + 1);
              self.lines = before.concat(after);
              self.cursor_y--; // Decrease cursor position.
              let current_length = self.lines[self.cursor_y].length;
              // Add the lines.
              self.lines[self.cursor_y] += prev_line;
              // Place x cursor at end of previous line.
              self.cursor_x = current_length;
            }
          }
        }
      }
      else if (key == "Delete") { // Delete
        if ((self.selection_start.x != -1) && (self.selection_start.y != -1)) {
          // We'll delete the selection.
          let viewport_coords = self.Get_Viewport_Coords();
          let number_of_lines = self.selection_end.y - self.selection_start.y + 1;
          if (number_of_lines > 0) {
            self.lines.splice(viewport_coords.y + self.selection_start.y, number_of_lines);
            // Deselect the area.
            self.selection_start.x = -1;
            self.selection_start.y = -1;
            self.Render();
          }
        }
        else {
          // We'll delete an entire line here.
          if (self.cursor_y > 0) { // Not the first line.
            if (self.cursor_y == (self.lines.length - 1)) { // Last line.
              self.lines = self.lines.slice(0, self.lines.length - 1);
              self.cursor_y--; // Decrease cursor y coordinate.
            }
            else { // Other line but not first.
              let before = self.lines.slice(0, self.cursor_y);
              let after = self.lines.slice(self.cursor_y + 1);
              self.lines = before.concat(after);
            }
          }
          else { // First line.
            if (self.lines.length > 1) {
              self.lines = self.lines.slice(self.cursor_y + 1);
            }
            else {
              self.lines[self.cursor_y] = ""; // Just clear it out.
            }
          }
        }
        self.cursor_x = 0; // Reset cursor.
      }
      else if (key == "ArrowLeft") { // Left
        if (self.cursor_x > 0) {
          self.cursor_x--;
        }
      }
      else if (key == "ArrowRight") { // Right
        // We can move one character out of bounds.
        if (self.cursor_x < self.lines[self.cursor_y].length) {
          self.cursor_x++;
        }
      }
      else if (key == "ArrowUp") { // Up
        // Don't change cursor x position unless we do so.
        if (self.cursor_y > 0) {
          self.cursor_y--;
          if (self.lines[self.cursor_y].length > 0) {
            if (self.cursor_x >= self.lines[self.cursor_y].length) {
              self.cursor_x = self.lines[self.cursor_y].length - 1;
            }
          }
          else {
            self.cursor_x = 0;
          }
        }
      }
      else if (key == "ArrowDown") { // Down
        if (self.cursor_y < (self.lines.length - 1)) {
          self.cursor_y++;
          if (self.lines[self.cursor_y].length > 0) {
            if (self.cursor_x >= self.lines[self.cursor_y].length) {
              self.cursor_x = self.lines[self.cursor_y].length - 1;
            }
          }
          else {
            self.cursor_x = 0;
          }
        }
      }
      else if (key == "Home") { // Home
        self.cursor_x = 0;
      }
      else if (key == "End") { // End
        if (self.lines[self.cursor_y].length > 0) {
          self.cursor_x = self.lines[self.cursor_y].length - 1;
        }
      }
      else if (key == "Tab") { // Tab
        if ((self.selection_start.x != -1) && (self.selection_start.y != -1)) {
          let number_of_lines = self.lines.length;
          let viewport_coords = self.Get_Viewport_Coords();
          for (let line_y = self.selection_start.y; line_y <= self.selection_end.y; line_y++) {
            if (line_y < number_of_lines) {
              self.lines[viewport_coords.y + line_y] = self.TAB_CHAR + self.lines[viewport_coords.y + line_y];
            }
          }
          // Deselect the area.
          self.selection_start.x = -1;
          self.selection_start.y = -1;
          self.Render();
        }
        else { // No lines selected.
          let before = self.lines[self.cursor_y].slice(0, self.cursor_x);
          let after = self.lines[self.cursor_y].slice(self.cursor_x);
          self.lines[self.cursor_y] = before + self.TAB_CHAR + after;
          self.cursor_x += self.TAB_CHAR.length;
        }
      }
      else if (key == "PageUp") { // Page Up
        if (self.cursor_y >= self.rows) {
          self.cursor_y -= self.rows; // Scroll one screen up.
        }
      }
      else if (key == "PageDown") { // Page Down
        if (self.cursor_y < (self.lines.length - self.rows)) {
          self.cursor_y += self.rows;
        }
      }
      else if (key.match(/Shift/))  { // Shift
        self.shift_mode = 1;
      }
      else { // Character Keys
        if (self.lines.length == 0) { // Insert blank line.
          self.lines.push("");
          self.cursor_x = 0;
          self.cursor_y = 0;
        }
        let before = self.lines[self.cursor_y].slice(0, self.cursor_x);
        let after = self.lines[self.cursor_y].slice(self.cursor_x);
        // Whoa? Do we have an actual character?
        if (self.key_map[key] != undefined) {
          let character = self.key_map[key].substring(self.shift_mode, self.shift_mode + 1);
          self.lines[self.cursor_y] = before + character + after;
          self.cursor_x++;
        }
      }
      // Render here.
      self.Render();
    }, false);
    this.elements[this.entity.id + "_text_input"].addEventListener("keyup", function(event) {
      let key = event.code;
      if (key.match(/Shift/)) {
        self.shift_mode = 0;
      }
    }, false);
    // Load up the default file if it exists.
    if (this.settings["file"] != undefined) {
      let file = new frankusFile(this.settings["file"]);
      file.on_read = function() {
        let lines = file.lines;
        self.Load({
          name: self.settings["file"],
          lines: lines.slice(0)
        })
      };
      file.Read();
    }
  }

  /**
   * Loads a file into the editor.
   * @param file The file to load into the editor.
   */
  Load(file) {
    // Check for code file.
    let ext = frankusFile.Get_Extension(file.name);
    if (this.code_files[ext] != undefined) {
      let untabbed_lines = file.lines.slice(0); // Create copy of lines.
      let line_count = untabbed_lines.length;
      if (line_count > 0) {
        let parts = file.name.split(/\//);
        this.opened_file = parts.pop(); // No path information.
        this.lines = [];
        for (let line_index = 0; line_index < line_count; line_index++) {
          // Convert all tabs to spaces.
          let line = untabbed_lines[line_index].replace(/\t/g, this.TAB_CHAR);
          this.lines.push(line);
        }
        this.cursor_x = 0;
        this.cursor_y = 0;
        // Render
        this.Render();
      }
      else { // Assign blank line.
        this.opened_file = "";
        this.lines = [ "" ];
        this.cursor_x = 0;
        this.cursor_y = 0;
        // Render
        this.Render();
      }
    }
    else {
      this.opened_file = "";
      this.lines = [ "" ];
      this.cursor_x = 0;
      this.cursor_y = 0;
      // Render
      this.Render();
    }
  }

  /**
   * Saves a file from the editor.
   * @param file The name of the file to save.
   */
  Save(file) {
    // Now save the code.
    file.lines = this.lines.slice(0);
  }

  /**
   * Clears out the editor.
   */
  Clear() {
    // Clear out the rest.
    this.lines = [ "" ];
    this.cursor_x = 0;
    this.cursor_y = 0;
    // Clear selection.
    this.selection_start.x = -1;
    this.selection_start.y = -1;
    this.selection_started = false;
    // Render.
    this.Render();
  }

  /**
   * Renders the editor viewport.
   */
  Render() {
    let viewport_coords = this.Get_Viewport_Coords();
    let html = "";
    let cursor_dx = this.cursor_x - viewport_coords.x;
    let cursor_dy = this.cursor_y - viewport_coords.y;
    let cursor_disp = "";
    for (let screen_y = 0; screen_y < this.rows; screen_y++) {
      let line_index = viewport_coords.y + screen_y;
      // Check for valid line index.
      if (line_index < this.lines.length) {
        html += String(this.lines[line_index].substring(viewport_coords.x, viewport_coords.x + this.columns) + "\n");
      }
      // Render the cursor.
      for (let screen_x = 0; screen_x < this.columns; screen_x++) {
        if ((this.selection_start.x == -1) && (this.selection_start.y == -1)) {
          // Do cursor highlighting.
          if ((cursor_dx == screen_x) && (cursor_dy == screen_y)) {
            cursor_disp += "&block;";
          }
          else {
            cursor_disp += " ";
          }
        }
        else if ((screen_x >= this.selection_start.x) && (screen_x <= this.selection_end.x) &&
                (screen_y >= this.selection_start.y) && (screen_y <= this.selection_end.y)) {
          cursor_disp += "&block;";
        }
        else {
          cursor_disp += " ";
        }
      }
      cursor_disp += "\n";
    }
    // Replace entities.
    html = html.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");
    // Highlight syntax.
    html = this.Highlight_Syntax(html);
    // Update viewport display.
    this.elements[this.entity.id + "_viewport"].innerHTML = html;
    // Update cursor display.
    this.elements[this.entity.id + "_cursor_area"].innerHTML = cursor_disp;
  }

  /**
   * Gets the viewport coordinates. The return object looks like this:
   * %
   * {
   *   x: 0,
   *   y: 0,
   *   half_screen_x: 0,
   *   half_screen_y: 0
   * }
   * %
   * @return The object containing viewport coordinates.
   */
  Get_Viewport_Coords() {
    let viewport_x = 0;
    let half_screen_x = Math.floor(this.columns / 2);
    if ((this.cursor_x >= 0) && (this.cursor_x < half_screen_x)) {
      viewport_x = 0;
    }
    else {
      viewport_x = this.cursor_x - half_screen_x;
    }
    let viewport_y = 0;
    let half_screen_y = Math.floor(this.rows / 2);
    if ((this.cursor_y >= 0) && (this.cursor_y < half_screen_y)) {
      viewport_y = 0;
    }
    else {
      viewport_y = this.cursor_y - half_screen_y;
    }
    return {
      x: viewport_x,
      y: viewport_y,
      half_screen_x: half_screen_x,
      half_screen_y: half_screen_y
    };
  }

  /**
   * Maps all code to letious line addresses.
   * @param file The name of the file to map.
   * @return The hash representing the code map.
   */
  Code_Map(file) {
    let parts = file.name.split(/\//);
    let fname = parts.pop(); // No path info.
    let ext = fname.replace(/^\w+\./, "");
    let map = {};
    // Add label to start of file.
    let label = "- start of file -";
    map[label] = 0;
    let class_name = "";
    // Parse out all subprograms.
    let line_count = this.lines.length;
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = this.lines[line_index];
      // Parse out labels.
      if (line.match(/^\s*label\s+\w+\s*$/)) {
        label = line.replace(/^\s*label\s+(\w+)\s*$/, "$1");
        map[label] = line_index;
      }
      if (line.match(/^\s*label\s+\w+\.\S+\s*$/)) { // A sub-label.
        label = line.replace(/^\s*label\s+(\w+\.\S+)\s*$/, "$1");
        map[label] = line_index;
      }
      // Parse out JavaScript functions.
      if (ext.match(/js/)) {
        if (line.match(/^\s*function\s+\w+\([^\)]*\)\s*\{\s*$/)) {
          label = line.replace(/^\s*function\s+(\w+)\([^\)]*\)\s*\{\s*$/, "$1");
          map[label] = line_index;
        }
        // Parse out JavaScript classes and methods.
        if (line.match(/^\s*class\s+\w+\s+(extends\s+[A-Za-z0-9_.]+\s+|)\{\s*$/)) {
          label = line.replace(/^\s*class\s+(\w+)\s+(extends\s+[A-Za-z0-9_.]+\s+|)\{\s*$/, "[$1]");
          map[label] = line_index;
          class_name = label;
        }
        // Static class function.
        if (line.match(/^\s*(static\s+|)\w+\([^\)]*\)\s+\{\s*$/)) {
          label = line.replace(/^\s*(static\s+|)(\w+)\([^\)]*\)\s+\{\s*$/, "$2");
          let inside_routine = line.replace(/^\s*(static\s+|)\w+\(([^\)]*)\)\s+\{\s*$/, "$1");
          if (!inside_routine.match(/function/)) {
            if (class_name.length > 0) {
              map[class_name + ":" + label] = line_index;
            }
            else {
              map[label] = line_index;
            }
          }
        }
        // Prototype class function.
        if (line.match(/^\s*\w+:\s+function\([^\)]*\)\s+\{\s*$/)) {
          label = line.replace(/^\s*(\w+):\s+function\([^\)]*\)\s+\{\s*$/, "$1");
          map[label] = line_index;
        }
      }
      // Parse C/C++ functions and methods.
      if (ext.match(/h|c|cpp|hpp/)) {
        // Global function.
        if (line.match(/^\s*\S+\s+\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*\S+\s+(\w+)\([^\)]*\)(\s+\{|)\s*$/, "$1");
          map[label] = line_index;
        }
        // Class function.
        if (line.match(/^\s*\S+\s+\w+::\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*\S+\s+(\w+)::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Constructor
        if (line.match(/^\s*\w+::\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*(\w+)::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Destructor
        if (line.match(/^\s*\w+::~\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*(\w+)::(~\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Constructor calling superclass constructor.
        if (line.match(/^\s*\w+::\w+\([^\)]*\)\s+:\s+\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*(\w+)::(\w+)\([^\)]*\)\s+:\s+\w+\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Template class function.
        if (line.match(/^\s*template\s+<[^>]*>\s+\S+\s+\w+<[^>]*>::\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+)<[^>]*>::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Template class constructor.
        if (line.match(/^\s*template\s+<[^>]*>\s+\w+<[^>]*>::\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*template\s+<[^>]*>\s+(\w+)<[^>]*>::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Template class destructor.
        if (line.match(/^\s*template\s+<[^>]*>\s+\w+<[^>]*>::~\w+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*template\s+<[^>]*>\s+(\w+)<[^>]*>::(~\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Template class operator.
        if (line.match(/^\s*template\s+<[^>]*>\s+\S+\s+\w+<[^>]*>::operator\S+\s+\([^\)]*\)(\s+\{|)\s*$/)) {
          label = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+)<[^>]*>::operator(\S+)\s+\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
          map[label] = line_index;
        }
        // Parse C++ classes.
        if (line.match(/^\s*class\s+\w+\s+\{\s*$/)) {
          label = line.replace(/^\s*class\s+(\w+)\s+\{\s*$/, "[$1]");
          map[label] = line_index;
        }
        // Class inheritance.
        if (line.match(/^\s*class\s+\w+\s+:\s+public\s+\w+\s+\{\s*$/)) {
          label = line.replace(/^\s*class\s+(\w+)\s+:\s+public\s+\w+\s+\{\s*$/, "[$1]");
          map[label] = line_index;
        }
        // Structure.
        if (line.match(/^\s*struct\s+\w+\s+\{\s*$/)) {
          label = line.replace(/^\s*struct\s+(\w+)\s+\{\s*$/, "[$1]");
          map[label] = line_index;
        }
      }
      // Parse Python functions and methods.
      if (ext.match(/py/)) {
        if (line.match(/^\s*def\s+\w+\([^\)]*\):\s*$/)) {
          label = line.replace(/^\s*def\s+(\w+)\([^\)]*\):\s*$/, "$1");
          map[label] = line_index;
        }
        // Parse out Python classes.
        if (line.match(/^\s*class\s+\w+\(?[^\)]*\)?:\s*$/)) {
          label = line.replace(/^\s*class\s+(\w+)\(?[^\)]*\)?:\s*$/, "[$1]");
          map[label] = line_index;
        }
      }
    }
    // Add label to end of file.
    label = "- end of file -";
    map[label] = line_count - 1;
    return map;
  }

  /**
   * Goes to a particular line.
   * @param The line number to go to. It is zero based.
   */
  Go_To_Line(line_no) {
    this.cursor_x = 0;
    this.cursor_y = line_no;
    this.Render();
  }

  /**
   * Searches for a string and goes to the line.
   * @param search_str The search string. Regex can be used.
   */
  Search(search_str) {
    let line_count = this.lines.length;
    for (let line_index = this.cursor_y; line_index < line_count; line_index++) {
      let line = this.lines[line_index];
      if (line.match(new RegExp(search_str))) {
        this.Go_To_Line(line_index);
        this.Render();
        break;
      }
    }
  }

  /**
   * Highlights syntax given code.
   * @param code The code string to highlight.
   * @return The formatted code with HTML.
   */
  Highlight_Syntax(code) {
    // Replace all keywords.
    let name = this.opened_file;
    if (this.opened_file.match(/^\w+\.\w+$/)) { // Make sure there is extension.
      let ext = this.opened_file.replace(/^\w+\./, "");
      if (this.keywords[ext] != undefined) {
        // Replace C-Lesh comment.
        code = code.replace(/(\bremark\b\s+)(.*)(\s+\bend\b)/mg, "$1<comment>$2</comment>$3");
        /*
        code = code.replace(/^remark/g, "remark<comment>")
                  .replace(/(\s+remark)/g, "$1<comment>")
                  .replace(/end$/g, "</comment>end")
                  .replace(/(end\s+)/g, "</comment>$1");
        */
        // Replace C style comment.
        code = code.replace(/(\/\/\s+)(.*)(\n)/g, "<comment>$1$2</comment>$3");
        // Replace C style multiline comment.
        code = code.replace(/(\/\*)/g, "<comment>$1")
                  .replace(/(\*\/)/g, "$1</comment>");
        // Replace Perl style comment.
        code = code.replace(/(#\s+)(.*)(\n)/g, "<comment>$1$2</comment>$3");
        // Now replace keywords.
        let keyword_count = this.keywords[ext].length;
        let end = "(\\s+|\\r|\\n|\\[|\\}|\\[|\\{|\\(|\\)|\\.|\\;|\\,|\\:|\\*|\\-|\\!|\\&)";
        for (let keyword_index = 0; keyword_index < keyword_count; keyword_index++) {
          let keyword = this.keywords[ext][keyword_index];
          code = code.replace(new RegExp("^" + keyword + end, "g"), "<keyword>" + keyword + "</keyword>$1")
                     .replace(new RegExp(end + keyword + "$", "g"), "$1<keyword>" + keyword + "</keyword>")
                     .replace(new RegExp(end + keyword + end, "g"), "$1<keyword>" + keyword + "</keyword>$2");
        }
        // Replace strings entities.
        code = code.replace(/\\'/g, "\\&apos;")
                   .replace(/\\"/g, "\\&quot;");
        // Replace strings, single and double quoted.
        code = code.replace(/'([^'\n\r]*)'/g, "<string>&apos;$1&apos;</string>")
                   .replace(/"([^"\n\r]*)"/g, '<string>&quot;$1&quot;</string>');
        // Replace namespaces and addresses.
        code = code.replace(/(\s+|\[)(\w+)(\.\w+)/g, "$1<namespace>$2</namespace>$3")
                   .replace(/(#\S+)/g, "<address>$1</address>");
        // Replace markers with real HTML.
        code = code.replace(/<keyword>/g, '<span class="frankus_keyword">')
                   .replace(/<comment>/g, '<span class="frankus_comment">')
                   .replace(/<string>/g, '<span class="frankus_string">')
                   .replace(/<namespace>/g, '<span class="frankus_namespace">')
                   .replace(/<address>/g, '<span class="frankus_address">')
                   .replace(/(<\/keyword>|<\/comment>|<\/string>|<\/namespace>|<\/address>)/g, "</span>");
      }
    }
    return code;
  }

  /**
   * Copies a selection using the saved selection coordinates.
   */
  Copy_Selection() {
    if ((this.selection_start.x != -1) && (this.selection_start.y != -1)) { // We have a selection.
      let viewport_coords = this.Get_Viewport_Coords();
      let line_count = this.selection_end.y - this.selection_start.y + 1;
      let copy_lines = [];
      for (let y = this.selection_start.y; y <= this.selection_end.y; y++) {
        let line_y = y + viewport_coords.y;
        if (line_y < 0) {
          line_y = 0;
        }
        if (line_y > (this.lines.length - 1)) {
          line_y = this.lines.length - 1;
        }
        let line = this.lines[line_y];
        let end_x = this.selection_end.x;
        if (end_x < 0) {
          end_x = 0;
        }
        if (end_x > (line.length - 1)) {
          end_x = line.length - 1;
        }
        let segment = line.slice(this.selection_start.x + viewport_coords.x, end_x + viewport_coords.x + 1);
        if (line_count > 1) { // Do this if the number of lines is more than 1.
          segment = line; // Copy whole line.
        }
        copy_lines.push(segment);
      }
      localStorage.setItem("copy_lines", copy_lines.join("\n"));
    }
  }

  /**
   * Validates if the cursor is in the right area.
   */
  Validate_Cursor() {
    // Validate cursor coordinates.
    if (this.cursor_y >= this.lines.length) {
      this.cursor_y = this.lines.length - 1;
    }
    if (this.cursor_y < 0) {
      this.cursor_y = 0;
    }
    if (this.cursor_x >= this.lines[this.cursor_y].length) {
      this.cursor_x = this.lines[this.cursor_y].length - 1;
    }
    if (this.cursor_x < 0) {
      this.cursor_x = 0;
    }
  }

  /**
   * Copies an entire routine.
   */
  Copy_Routine() {
    let line_count = this.lines.length;
    let start_line = this.cursor_y;
    let copy_lines = [];
    for (let line_index = start_line; line_index < line_count; line_index++) {
      let line = this.lines[line_index];
      if (line.match(/^\s*$/)) { // All spaces?
        break;
      }
      copy_lines.push(line);
    }
    localStorage.setItem("copy_lines", copy_lines.join("\n"));
  }

  /**
   * Pastes a selection at the current location.
   * @param external_data Optional parameter with data passed externally.
   */
  Paste(external_data) {
    let data = (external_data) ? external_data.replace(/\t/g, this.TAB_CHAR) : localStorage.getItem("copy_lines");
    if (data) {
      let copy_lines = Frankus_Split(data);
      if (copy_lines.length == 1) {
        // Do string insert.
        let before = this.lines[this.cursor_y].substring(0, this.cursor_x);
        let after = this.lines[this.cursor_y].substring(this.cursor_x);
        this.lines[this.cursor_y] = before + copy_lines[0] + after;
        this.Render();
      }
      else {
        let before = this.lines.slice(0, this.cursor_y);
        let after = this.lines.slice(this.cursor_y);
        this.lines = before.concat(copy_lines, after);
        this.Render();
      }
    }
  }

}

// =============================================================================
// Frankus Frame
// =============================================================================

/**
 * A subframe inside of a page where other HTML pages can be loaded.
 */
class frankusFrame extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id + "_frame",
      type: "iframe",
      attrib: {
        src: "",
        title: "API Documentation"
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px", 
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "margin": "0",
        "padding": "0",
        "border": "none"
      }
    }, this.container);
  }

  /**
   * Loads an HTML page into the frame.
   * @param name The name of the HTML page.
   */
  Load(name) {
    this.elements[this.entity.id + "_frame"].src = name + ".html";
  }

}

// =============================================================================
// Frankus Bump Map Editor
// =============================================================================

/**
 * Allows editing of bump maps.
 */
class frankusBump_Map_Editor extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.canvas = null;
    this.box = {
      left: 0,
      top: 0,
      right: 15,
      bottom: 15
    };
    this.sprite = new Image();
    this.sprite_loaded = false;
    this.corner_hit = "";
    this.Create();
  }

  Create() {
    this.canvas = this.Create_Element({
      id: this.entity.id,
      type: "canvas",
      attrib: {
        width: this.entity.width - 2,
        height: this.entity.height - 2
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      }
    }, this.container);
    this.surface = this.canvas.getContext("2d");
    this.Render();
    let self = this;
    this.canvas.addEventListener("mousedown", function(event) {
      let mouse_x = event.offsetX;
      let mouse_y = event.offsetY;
      self.corner_hit = "";
      if ((mouse_x >= (self.box.left - 4)) && (mouse_x <= (self.box.left + 4)) && (mouse_y >= (self.box.top - 4)) && (mouse_y <= (self.box.top + 4))) {
        // We're in left-top box.
        self.corner_hit = "left-top";
        let width = self.box.right - self.box.left + 1;
        let height = self.box.bottom - self.box.top + 1;
        self.box.left = mouse_x;
        self.box.top = mouse_y;
        self.box.right = self.box.left + width - 1;
        self.box.bottom = self.box.top + height - 1;
        self.Render();
      }
      else if ((mouse_x >= (self.box.right - 4)) && (mouse_x <= (self.box.right + 4)) && (mouse_y >= (self.box.top - 4)) && (mouse_y <= (self.box.top + 4))) {
        // We're in right-top box.
        self.corner_hit = "right-top";
        if (self.box.right > self.box.left) {
          self.box.right = mouse_x;
          self.Render();
        }
      }
      else if ((mouse_x >= (self.box.right - 4)) && (mouse_x <= (self.box.right + 4)) && (mouse_y >= (self.box.bottom - 4)) && (mouse_y <= (self.box.bottom + 4))) {
        // We're in right-bottom box.
        self.corner_hit = "right-bottom";
        if ((self.box.right > self.box.left) && (self.box.bottom > self.box.top)) {
          self.box.right = mouse_x;
          self.box.bottom = mouse_y;
          self.Render();
        }
      }
      else if ((mouse_x >= (self.box.left - 4)) && (mouse_x <= (self.box.left + 4)) && (mouse_y >= (self.box.bottom - 4)) && (mouse_y <= (self.box.bottom + 4))) {
        // We're in left-bottom box.
        self.corner_hit = "left-bottom";
        if (self.box.bottom > self.box.top) {
          self.box.bottom = mouse_y;
          self.Render();
        }
      }
    }, false);
    this.canvas.addEventListener("mouseup", function(event) {
      self.corner_hit = ""; // Release corner.
    }, false);
    this.canvas.addEventListener("mouseout", function(event) {
      self.corner_hit = ""; // Release corner.
    }, false);
    this.canvas.addEventListener("mouseleave", function(event) {
      self.corner_hit = ""; // Release corner.
    }, false);
    this.canvas.addEventListener("mousemove", function(event) {
      let mouse_x = event.offsetX;
      let mouse_y = event.offsetY;
      if (self.corner_hit == "left-top") {
        let width = self.box.right - self.box.left + 1;
        let height = self.box.bottom - self.box.top + 1;
        self.box.left = mouse_x;
        self.box.top = mouse_y;
        self.box.right = self.box.left + width - 1;
        self.box.bottom = self.box.top + height - 1;
        self.Render();
      }
      else if (self.corner_hit == "right-top") {
        if (self.box.right > self.box.left) {
          self.box.right = mouse_x;
          self.Render();
        }
      }
      else if (self.corner_hit == "right-bottom") {
        if ((self.box.right > self.box.left) && (self.box.bottom > self.box.top)) {
          self.box.right = mouse_x;
          self.box.bottom = mouse_y;
          self.Render();
        }
      }
      else if (self.corner_hit == "left-bottom") {
        if (self.box.bottom > self.box.top) {
          self.box.bottom = mouse_y;
          self.Render();
        }
      }
    }, false);
  }

  /**
   * Renders the rectangle onto the canvas.
   */
  Render() {
    this.surface.fillStyle = "white";
    this.surface.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.sprite_loaded) {
      this.surface.drawImage(this.sprite, 0, 0);
    }
    this.surface.fillStyle = "lime";
    this.surface.globalAlpha = 0.5;
    let width = this.box.right - this.box.left + 1;
    let height = this.box.bottom - this.box.top + 1;
    this.surface.fillRect(this.box.left, this.box.top, width, height);
    // Draw corners.
    this.surface.globalAlpha = 1.0;
    this.surface.strokeStyle = "blue";
    this.surface.strokeRect(this.box.left - 4, this.box.top - 4, 9, 9);
    this.surface.strokeRect(this.box.left - 4, this.box.bottom - 4, 9, 9);
    this.surface.strokeRect(this.box.right - 4, this.box.top - 4, 9, 9);
    this.surface.strokeRect(this.box.right - 4, this.box.bottom - 4, 9, 9);
  }

  /**
   * Loads a bump map.
   * @param bump_map The bump map object.
   */
  Load(bump_map) {
    this.box.left = bump_map.left;
    this.box.top = bump_map.top;
    this.box.right = bump_map.right;
    this.box.bottom = bump_map.bottom;
    this.Render();
  }

  /**
   * Saves a bump map.
   * @param bump_map The bump map object to save to.
   */
  Save(bump_map) {
    bump_map.left = this.box.left;
    bump_map.top = this.box.top;
    bump_map.right = this.box.right;
    bump_map.bottom = this.box.bottom;
    this.Render();
  }

  /**
   * Loads a sprite into the background.
   * @param name The name of the sprite.
   */
  Load_Sprite(name) {
    let self = this;
    this.sprite_loaded = false;
    this.sprite.addEventListener("load", function(event) {
      self.sprite_loaded = true;
      self.Render();
    }, false);
    this.sprite.src = Frankus_Get_Image(name + ".png", false);
  }

  /**
   * Clears out the bump map editor.
   */
  Clear() {
    this.surface.fillStyle = "white";
    this.surface.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

}

// =============================================================================
// Sound Editor
// =============================================================================

/**
 * A component that allows you to edit sound tracks.
 * 
 * Properties are as follows:
 * 
 * file - The file containing the names of the sound samples.
 */
class frankusSound_Editor extends frankusComponent {

  DEFAULT_ROWS = 10;
  DEFAULT_COLS = 10 * 4; // 1/4 second beat.
  FRANKUS_CELL_W = 16;
  FRANKUS_CELL_H = 16;

  constructor(entity, settings, container) {
    super(entity, settings, container);
    // Allocate grid size for 10 second track which will be default. There
    // will be 5 tracks by default.
    this.grid = [];
    for (let row_index = 0; row_index < this.DEFAULT_ROWS; row_index++) {
      let row = [];
      for (let col_index = 0; col_index < this.DEFAULT_COLS; col_index++) {
        row.push("");
      }
      this.grid.push(row);
    }
    this.pos = 0.0; // In seconds.
    this.scroll_x = 0;
    this.scroll_y = 0;
    this.sound_palette = {};
    this.timer = null;
    this.sounds_loaded = false;
    this.sound_block_loaded = false;
    this.sound_block = null;
    this.sel_sound = "";
    this.Create();
  }

  Create() {
    let self = this;
    this.canvas = this.Create_Element({
      id: this.entity.id,
      type: "canvas",
      attrib: {
        width: this.entity.width - 26,
        height: this.entity.height - 26
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 26) + "px",
        "height": String(this.entity.height - 26) + "px"
      }
    }, this.container);
    this.surface = this.canvas.getContext("2d");
    // Create scrollers.
    let h_scroller_form = this.Create_Element({
      id: this.entity.id + "_h_scroller_form",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + (this.entity.height - 2) - 24) + "px",
        "width": String(this.entity.width - 26) + "px",
        "height": "24px",
        "margin": "0",
        "padding": "0",
        "overflow": "hidden"
      },
      subs: [
        {
          id: this.entity.id + "_h_scroller",
          type: "input",
          attrib: {
            type: "range",
            min: 0,
            max: this.DEFAULT_COLS * 10, // 100 seconds.
            step: 1,
            value: 0
          },
          css: {
            "width": "100%",
            "height": "100%",
            "margin": "0",
            "padding": "0",
            "cursor": Frankus_Get_Image("Cursor.png", true) + ", default",
            "background-image": Frankus_Get_Image("Range.png", true)
          }
        }
      ]
    }, this.container);
    this.h_scroller = h_scroller_form.firstChild;
    this.h_scroller.addEventListener("input", function(event) {
      self.scroll_x = event.target.value * self.FRANKUS_CELL_W;
      self.Render();
    }, false);
    let v_scroller_form = this.Create_Element({
      id: this.entity.id + "_v_scroller_form",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + (this.entity.width - 2) - 24) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": "24px",
        "height": String(this.entity.height - 26) + "px",
        "margin": "0",
        "padding": "0",
        "overflow": "hidden"
      },
      subs: [
        {
          id: this.entity.id + "_v_scroller",
          type: "input",
          attrib: {
            type: "range",
            min: 0,
            max: this.DEFAULT_ROWS,
            step: 1,
            value: 0
          },
          css: {
            "width": String(this.entity.height - 26) + "px",
            "height": "24px",
            "transform": "rotate(90deg) translate(0, -24px)",
            "transform-origin": "0 0",
            "margin": "0",
            "padding": "0",
            "cursor": Frankus_Get_Image("Cursor.png", true) + ", default",
            "background-image": Frankus_Get_Image("Range.png", true)
          }
        }
      ]
    }, this.container);
    this.v_scroller = v_scroller_form.firstChild;
    this.v_scroller.addEventListener("input", function(event) {
      self.scroll_y = event.target.value * self.FRANKUS_CELL_H;
      self.Render();
    }, false);
    // Add the sound stack.
    this.sound_stack = this.Create_Element({
      id: this.entity.id + "_sound_stack",
      type: "div",
      css: {
        "position": "absolute",
        "left": "-2000px",
        "top": "0"
      }
    }, this.container);
    // Add default sound block icon.
    this.sound_block = new Image();
    this.sound_block.onload = function() {
      self.sound_block_loaded = true;
    };
    this.sound_block.src = Frankus_Get_Image("Sound_Block.png", false);
    // Add mouse handlers for canvas.
    this.canvas.addEventListener("click", function(event) {
      let mouse_x = event.offsetX;
      let mouse_y = event.offsetY;
      // Check to see which cell was clicked.
      let row_count = self.grid.length;
      for (let row_index = 0; row_index < row_count; row_index++) {
        let row = self.grid[row_index];
        let col_count = row.length;
        for (let col_index = 0; col_index < col_count; col_index++) {
          let sound = row[col_index];
          let bump_map = {
            left: col_index * (self.FRANKUS_CELL_W + 1) - self.scroll_x,
            top: row_index * (self.FRANKUS_CELL_H + 1) - self.scroll_y,
            right: (col_index * (self.FRANKUS_CELL_W + 1)) + self.FRANKUS_CELL_W - self.scroll_x,
            bottom: (row_index * (self.FRANKUS_CELL_H + 1)) + self.FRANKUS_CELL_H - self.scroll_y
          };
          if ((mouse_x >= bump_map.left) && (mouse_x <= bump_map.right) && (mouse_y >= bump_map.top) && (mouse_y <= bump_map.bottom)) {
            if (sound.length > 0) {
              row[col_index] = "";
            }
            else {
              row[col_index] = self.sel_sound;
              self.Play_Sound(self.sel_sound);
            }
            self.Render();
            break;
          }
        }
      }
    }, false);
  }

  /**
   * Loads the sound palette.
   * @param name The name of the sound palette.
   */
  Load_Sound_Palette(name) {
    let self = this;
    this.sounds_loaded = false;
    let pal_file = new frankusFile("Sounds/" + name + ".txt");
    pal_file.on_read = function() {
      let sounds = pal_file.lines;
      // Clean out sound stack.
      self.Remove_Elements(self.sound_stack);
      self.Load_Sound(sounds, 0, function() {
        self.sounds_loaded = true;
      });
    };
    pal_file.Read();
  }

  /**
   * Loads a collection of sounds into the sound stack.
   * @param sounds The array of sounds to be loaded. 
   * @param index The index of the sound in the array to load. 
   * @param on_load Called when all the sounds have been loaded. 
   */
  Load_Sound(sounds, index, on_load) {
    let self = this;
    if (index < sounds.length) {
      let name = sounds[index];
      let icon = new Image();
      icon.onload = function() {
        let audio = self.Create_Element({
          id: self.entity.id + "_sound_" + name,
          type: "audio",
          subs: [
            {
              id: self.entity.id + "_sound_source_wav_" + name,
              type: "source",
              attrib: {
                src: "Sounds/" + name + ".wav",
                type: "audio/wav"
              }
            }
          ]
        }, self.sound_stack);
        self.sound_palette[name] = {
          icon: icon,
          sound: audio
        };
        // Try to force loading of the sound.
        audio.load();
        if (frankus_layout.browser.name == "firefox") {
          self.Load_Sound(sounds, index + 1, on_load);
        }
        else {
          audio.addEventListener("canplaythrough", function() {
            self.Load_Sound(sounds, index + 1, on_load);
          }, false);
        }
      };
      icon.src = Frankus_Get_Image(name + ".png", false);
    }
    else {
      on_load();
    }
  }

  /**
   * Renders the sound grid.
   */
  Render() {
    if (this.sounds_loaded) {
      // Clear the canvas.
      this.surface.globalAlpha = 1.0;
      this.surface.fillStyle = "white";
      this.surface.fillRect(0, 0, this.canvas.width, this.canvas.height);
      // Grab grid dimensions.
      let row_count = this.grid.length;
      let col_count = this.grid[0].length;
      // Draw black box.
      this.surface.fillStyle = "black";
      this.surface.fillRect(0 - this.scroll_x, 0 - this.scroll_y, col_count * (this.FRANKUS_CELL_W + 1) + 1, row_count * (this.FRANKUS_CELL_H + 1) + 1);
      // Draw the grid boxes and icons.
      for (let row_index = 0; row_index < row_count; row_index++) {
        for (let col_index = 0; col_index < col_count; col_index++) {
          let x = col_index * (this.FRANKUS_CELL_W + 1) + 1 - this.scroll_x;
          let y = row_index * (this.FRANKUS_CELL_H + 1) + 1 - this.scroll_y;
          let sound = this.grid[row_index][col_index];
          if (this.sound_block_loaded) {
            this.surface.drawImage(this.sound_block, x, y);
          }
          if (this.sound_palette[sound] != undefined) {
            this.surface.drawImage(this.sound_palette[sound].icon, x, y);
          }
        }
      }
      // Highlight current position.
      this.surface.fillStyle = "yellow";
      this.surface.globalAlpha = 0.5;
      let pos = Math.floor(this.pos * 4) * (this.FRANKUS_CELL_W + 1) + 1 - this.scroll_x;
      this.surface.fillRect(pos, 0 - this.scroll_y, this.FRANKUS_CELL_W, (this.FRANKUS_CELL_H + 1) * row_count + 1);
    }
  }

  /**
   * Sets the position in seconds or fractions of.
   * @param pos The position in fractional seconds. This is a string.
   */
  Set_Position(pos) {
    this.pos = parseFloat(pos);
    let time_end = this.grid[0].length * 0.25;
    if (this.pos < 0.0) {
      this.pos = 0.0;
    }
    if (this.pos >= time_end) {
      this.pos = time_end - 0.25;
    }
    this.Render();
  }

  /**
   * Plays the sound tracks.
   * @param on_play Called for every note played on the track. The time is passed in.
   */
  Play(on_play) {
    if (!this.timer && this.sounds_loaded) { // Track stopped?
      let self = this;
      let time_end = this.grid[0].length * 0.25;
      this.timer = setInterval(function() {
        if (self.pos < time_end) {
          // Play the audio column.
          let track_count = self.grid.length;
          let col_index = Math.floor(self.pos * 4);
          for (let track_index = 0; track_index < track_count; track_index++) {
            let sound = self.grid[track_index][col_index];
            self.Play_Sound(sound);
          }
          self.Render();
          on_play(self.pos);
          self.pos += 0.25;
        }
        else {
          self.Stop();
          self.pos = 0.0;
          self.Render();
        }
      }, 250); // 1/4 a second interval.
    }
  }

  /**
   * Stops the track.
   */
  Stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.Render();
    }
  }

  /**
   * Clears the track.
   */
  Clear() {
    this.Stop();
    this.pos = 0.0;
    let row_count = this.grid.length;
    for (let row_index = 0; row_index < row_count; row_index++) {
      let col_count = this.grid[row_index].length;
      for (let col_index = 0; col_index < col_count; col_index++) {
        this.grid[row_index][col_index] = "";
      }
    }
    this.Render();
  }

  /**
   * Resizes the track to the time length.
   * @param time_length The length of time to resize the track to. 
   */
  Resize(time_length) {
    let row_count = this.grid.length;
    let col_count = Math.floor(time_length * 4);
    for (let row_index = 0; row_index < row_count; row_index++) {
      this.grid[row_index] = [];
      for (let col_index = 0; col_index < col_count; col_index++) {
        this.grid[row_index].push("");
      }
    }
    this.Render();
  }

  /**
   * Loads a track from a file.
   * @param name The name of the track.
   * @param on_load Called when the track is loaded the track time length is passed in.
   * @param on_error Called if the track was not loaded.
   */
  Load_Track(name, on_load, on_error) {
    let self = this;
    // Stop the track if it is playing.
    this.Stop();
    this.pos = 0.0;
    let track_file = new frankusFile("Tracks/" + name + ".txt");
    track_file.on_read = function() {
      let tracks = track_file.lines;
      let track_count = tracks.length;
      // Recreate grid to accomodate track.
      self.grid = [];
      let time_length = 0.0;
      for (let track_index = 0; track_index < track_count; track_index++) {
        let sounds = tracks[track_index].split(/,/);
        let sound_count = sounds.length;
        time_length = sound_count * 0.25;
        self.grid.push([]);
        for (let sound_index = 0; sound_index < sound_count; sound_index++) {
          let sound = sounds[sound_index];
          self.grid[track_index].push(sound);
        }
      }
      self.Render();
      // Callback with time passed in.
      on_load(time_length);
    };
    track_file.on_not_found = function() {
      on_error();
    };
    track_file.Read();
  }

  /**
   * Saves a track into a file.
   * @param name The name of the file to save the track into.
   */
  Save_Track(name) {
    let track_count = this.grid.length;
    let save_file = new frankusFile("Tracks/" + name + ".txt");
    for (let track_index = 0; track_index < track_count; track_index++) {
      let track = this.grid[track_index];
      save_file.Add(track.join(","));
    }
    save_file.on_write = function() {
      console.log(save_file.message);
    };
    save_file.Write();
  }

  /**
   * Gets the time length of the track.
   * @return The length of in seconds.
   */
  Get_Time_Length() {
    return (this.grid[0].length * 0.25);
  }

  /**
   * Plays a sound sample from the sound palette.
   * @param name The name of the sound.
   */
  Play_Sound(name) {
    if (this.sound_palette[name] != undefined) {
      let sound = this.sound_palette[name].sound;
      sound.currentTime = 0;
      sound.play();
    }
  }

}

// =============================================================================
// Frankus Message Board
// =============================================================================

/**
 * Creates a fully functional message board. The board may be read but only
 * written if the editor code is provided. The properties are as follows:
 *
 * - font - The font to use for the forum.
 */
class frankusBoard extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.current_thread = "";
    this.current_post = "";
    this.rendering = false;
    this.Create();
  }
  
  Create() {
    let board = this.Create_Element({
      id: this.entity.id + "_topic_board",
      type: "div",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "background-color": "#f7fbff"
      },
      subs: [
        {
          id: this.entity.id + "_topic_area",
          type: "div",
          css: {
            "margin": "1px",
            "margin-top": "32px",
            "padding": "4px",
            "width": "calc(100% - 10px)",
            "height": "calc(100% - 41px)",
            "overflow-y": "scroll",
            "overflow-x": "hidden",
            "font-family": this.settings["font"] || "Regular, sans-serif",
            "font-size": "16px",
            "color": "black",
            "background-color": "white"
          }
        },
        this.Make_Button(this.entity.id + "_new_topic", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "New Topic"
        }),
        this.Make_Button(this.entity.id + "_reply_post", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "Reply"
        }),
        this.Make_Button(this.entity.id + "_disp_topics", {
          "top": 1,
          "right": 108,
          "width": 100,
          "height": 30,
          "bg-color": "#3f8ee8",
          "fg-color": "white",
          "label": "Topics"
        }),
        this.Make_Button(this.entity.id + "_print", {
          "top": 1,
          "left": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#d6841a",
          "fg-color": "white",
          "label": "Print"
        })
      ]
    }, this.container);
    let self = this;
    // Create handlers for buttons.
    this.elements[this.entity.id + "_new_topic"].addEventListener("click", function(event) {
      if (!self.rendering) {
        self.Toggle_Topic_Form(true);
      }
    }, false);
    this.elements[this.entity.id + "_reply_post"].addEventListener("click", function(event) {
      if (!self.rendering) {
        self.Toggle_Post_Form(true);
      }
    }, false);
    this.elements[this.entity.id + "_disp_topics"].addEventListener("click", function(event) {
      if (!self.rendering) {
        self.Toggle_Board(true);
      }
    }, false);
    let reply_box = this.Create_Element({
      id: this.entity.id + "_topic_reply_box",
      type: "div",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px",
        "background-color": "#f7fbff",
        "display": "none"
      },
      subs: [
        {
          id: this.entity.id + "_screen_name_area",
          type: "div",
          css: {
            "margin": "1px",
            "margin-top": "32px",
            "width": "calc(100% - 2px)",
            "height": "32px",
            "position": "relative"
          },
          subs: [
            this.Make_Form(this.entity.id + "_screen_name_form", [
              this.Make_Field(this.entity.id + "_screen_name", {
                "label": "Enter screen name.",
                "height": 24
              })
            ])
          ]
        },
        {
          id: this.entity.id + "_reply_area",
          type: "div",
          css: {
            "margin": "1px",
            "margin-top": "1px",
            "width": "calc(100% - 2px)",
            "height": "calc(100% - 34px)",
            "position": "relative"
          },
          subs: [
            {
              id: this.entity.id + "_topic_form_area",
              type: "div",
              css: {
                "width": "100%",
                "height": "30px",
                "position": "relative",
                "display": "none"
              },
              subs: [
                this.Make_Form(this.entity.id + "_topic_form", [
                  this.Make_Field(this.entity.id + "_topic_title", {
                    "label": "Enter topic here.",
                    "height": 24
                  })
                ])
              ]
            },
            {
              id: this.entity.id + "_post_form_area",
              type: "div",
              css: {
                "width": "100%",
                "height": "calc(100% - 96px)",
                "position": "relative",
                "display": "none"
              },
              subs: [
                this.Make_Form(this.entity.id + "_post_form", [
                  this.Make_Edit(this.entity.id + "_topic_post", {
                    "label": "Type in post here."
                  })
                ])
              ]
            }
          ]
        },
        this.Make_Button(this.entity.id + "_post_topic", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#3f8ee8",
          "fg-color": "white",
          "label": "Post"
        }),
        this.Make_Button(this.entity.id + "_cancel_topic", {
          "top": 1,
          "right": 108,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "Cancel"
        }),
        this.Make_Button(this.entity.id + "_post_reply", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#3f8ee8",
          "fg-color": "white",
          "label": "Post"
        }),
        this.Make_Button(this.entity.id + "_cancel_reply", {
          "top": 1,
          "right": 108,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "Cancel"
        }),
        this.Make_Button(this.entity.id + "_post_edit", {
          "top": 1,
          "right": 4,
          "width": 100,
          "height": 30,
          "bg-color": "#3f8ee8",
          "fg-color": "white",
          "label": "Edit"
        }),
        this.Make_Button(this.entity.id + "_cancel_edit", {
          "top": 1,
          "right": 108,
          "width": 100,
          "height": 30,
          "bg-color": "#25cc76",
          "fg-color": "white",
          "label": "Cancel"
        })
      ]
    }, this.container);
    // Add handlers for buttons.
    this.elements[this.entity.id + "_post_topic"].addEventListener("click", function(event) {
      if (!self.rendering) {
        self.Post_Topic(self.elements[self.entity.id + "_screen_name"],
                             self.elements[self.entity.id + "_topic_title"],
                             self.elements[self.entity.id + "_topic_post"],
                             function() {
                               self.Toggle_Topic_Form(false);
                               self.Toggle_Board(true);
                             });
      }
    }, false);
    this.elements[this.entity.id + "_cancel_topic"].addEventListener("click", function(event) {
      if (!self.rendering) {
        self.Toggle_Topic_Form(false);
        self.Toggle_Board(true);
      }
    }, false);
    this.elements[this.entity.id + "_post_reply"].addEventListener("click", function(event) {
      if (!self.rendering) {
        self.Post_Reply(self.current_thread,
                             self.elements[self.entity.id + "_screen_name"],
                             self.elements[self.entity.id + "_topic_title"],
                             self.elements[self.entity.id + "_topic_post"],
                             function() {
                               self.Toggle_Post_Form(false);
                               self.Toggle_Thread(true, self.current_thread);
                             });
      }
    }, false);
    this.elements[this.entity.id + "_cancel_reply"].addEventListener("click", function(event) {
      if (!self.rendering) {
        self.Toggle_Post_Form(false);
        self.Toggle_Thread(true, self.current_thread);
      }
    }, false);
    this.elements[this.entity.id + "_post_edit"].addEventListener("click", function(event) {
      if (!self.rendering) {
        self.Post_Edit(self.current_post,
                            self.elements[self.entity.id + "_screen_name"],
                            self.elements[self.entity.id + "_topic_post"],
                            function() {
                              self.Toggle_Edit_Form(false);
                              self.Toggle_Thread(true, self.current_thread);
                            });
      }
    }, false);
    this.elements[this.entity.id + "_cancel_edit"].addEventListener("click", function(event) {
      if (!self.rendering) {
        self.Toggle_Edit_Form(false);
        self.Toggle_Thread(true, self.current_thread);
      }
    }, false);
    this.elements[this.entity.id + "_print"].addEventListener("click", function(event) {
      if (!self.rendering) {
        let thread_win = window.open(frankus_http + location.host + "/Print.html");
        let board_topic_area = self.elements[self.entity.id + "_topic_area"];
        let html = [];
        let post_count = board_topic_area.childNodes.length;
        for (let post_index = 0; post_index < post_count; post_index++) {
          let post = board_topic_area.childNodes[post_index];
          html.push(post.innerHTML);
        }
        thread_win.addEventListener("load", function(event) {
          let body = thread_win.document.body;
          body.innerHTML = html.join('<div class="page-break"></div>');
          for (let post_index = 0; post_index < post_count; post_index++) {
            // Turn off edit button.
            let edit_button = thread_win.document.getElementById(self.entity.id + "_edit_post_" + post_index);
            edit_button.style.display = "none";
          }
        });
      }
    }, false);
    // Display the topics.
    this.Display_Topics();
  }
  
  /**
   * Removes the loaded topics allowing for garbage collection.
   */
  Remove_Topics(container) {
    let items = container.childNodes.slice(0);
    let item_count = items.length;
    for (let item_index = 0; item_index < item_count; item_index++) {
      let item = items[item_index];
      let id = item.id;
      container.removeChild(item);
      // Remove element reference for garbage collection.
      delete this.elements[id];
    }
  }
  
  /**
   * Displays all topics in the message board.
   */
  Display_Topics() {
    let self = this;
    // Show and hide necessary buttons.
    this.Show(this.entity.id + "_new_topic");
    this.Hide(this.entity.id + "_disp_topics");
    this.Hide(this.entity.id + "_reply_post");
    this.Hide(this.entity.id + "_print");
    this.rendering = true;
    let topics_file = new frankusFile("Board/Topics.txt");
    topics_file.on_read = function() {
      self.Remove_Elements(self.elements[self.entity.id + "_topic_area"]);
      let topics = topics_file.lines;
      topics.reverse();
      let topic_count = topics.length;
      for (let topic_index = 0; topic_index < topic_count; topic_index++) {
        let topic = topics[topic_index].split(/:/);
        let title = topic[0];
        let thread = topic[1];
        let status = topic[2];
        if (status == "deleted") {
          continue; // This topic is not to be displayed.
        }
        // Create topic link.
        let topic_link = self.Create_Element({
          id: self.entity.id + "_topic_link_" + topic_index,
          type: "div",
          text: title,
          css: {
            "width": "calc(100% - 2px)",
            "height": "24px",
            "margin": "1px",
            "color": "black",
            "position": "relative",
            "cursor": String(Frankus_Get_Image("Cursor.png", true) + ", default"),
            "margin-bottom": "0",
            "border-bottom": "1px dashed #bfdcfd",
            "position": "relative"
          },
          subs: [
            {
              id: self.entity.id + "_topic_delete_" + topic_index,
              type: "div",
              css: {
                "position": "absolute",
                "right": "4px",
                "top": "4px",
                "width": "16px",
                "height": "16px",
                "background-image": Frankus_Get_Image("Clear.png", true),
                "cursor": String(Frankus_Get_Image("Cursor.png", true) + ", default")
              }
            }
          ]
        }, self.entity.id + "_topic_area");
        topic_link.frankus_thread_id = thread;
        // Add handlers for topic link.
        topic_link.addEventListener("click", function(event) {
          if (!self.rendering) {
            let link = event.target;
            if (link.frankus_thread_id) {
              self.current_thread = link.frankus_thread_id;
              self.Display_Posts(link.frankus_thread_id);
            }
          }
        }, false);
        // Add for topic delete.
        self.elements[self.entity.id + "_topic_delete_" + topic_index].frankus_thread_id = thread;
        self.elements[self.entity.id + "_topic_delete_" + topic_index].addEventListener("click", function(event) {
          if (!self.rendering) {
            let link = event.target;
            self.Update_Topic(link.frankus_thread_id, "deleted");
            event.stopPropagation();
          }
        }, false);
      }
      self.rendering = false;
    };
    topics_file.on_not_found = function() {
      self.Remove_Elements(self.elements[self.entity.id + "_topic_area"]);
      self.elements[self.entity.id + "_topic_area"].innerHTML = "No topics to display.";
      self.rendering = false;
    };
    topics_file.Read();
  }
  
  /**
   * Updates the status of a topic.
   * @param thread_id The ID of the thread associated with the topic.
   * @param status The status of the topic.
   */
  Update_Topic(thread_id, status) {
    let self = this;
    this.rendering = true;
    let topics_file = new frankusFile("Board/Topics.txt");
    topics_file.on_read = function() {
      let topics = topics_file.lines;
      let topic_count = topics.length;
      for (let topic_index = 0; topic_index < topic_count; topic_index++) {
        let topic = topics[topic_index].split(/:/);
        let title = topic[0];
        let thread = topic[1];
        let topic_status = topic[2];
        if (thread == thread_id) {
          topic_status = status;
          topic = title + ":" + thread + ":" + topic_status;
          topics[topic_index] = topic;
          break;
        }
      }
      // Write out changes.
      let save_file = new frankusFile("Board/Topics.txt");
      save_file.Add_Lines(topics.join("\n"));
      save_file.on_write = function() {
        // Reload the topics display.
        self.Toggle_Board(true);
        self.rendering = false;
      };
      save_file.on_not_found = function() {
        self.Toggle_Board(true);
        self.rendering = false;
      };
      save_file.Write();
    };
    topics_file.Read();
  }
  
  /**
   * Displays the posts associated with the topic.
   * @param thread_id The ID of the thread with the posts.
   */
  Display_Posts(thread_id) {
    let self = this;
    this.Show(this.entity.id + "_disp_topics");
    this.Show(this.entity.id + "_reply_post");
    this.Show(this.entity.id + "_print");
    this.Hide(this.entity.id + "_new_topic");
    this.rendering = true;
    let thread_file = new frankusFile("Board/Thread_" + thread_id + ".txt");
    thread_file.on_read = function() {
      self.Remove_Elements(self.elements[self.entity.id + "_topic_area"]);
      // Extract posts from thread.
      let posts = thread_file.lines;
      self.Render_Post(posts, 0);
    };
    thread_file.on_not_found = function() {
      self.Remove_Elements(self.elements[self.entity.id + "_topic_area"]);
      self.elements[self.entity.id + "_topic_area"].innerHTML = "No posts.";
      self.rendering = false;
    };
    thread_file.Read();
  }
  
  /**
   * Renders a post, one at a time, from an array.
   * @param posts The array of posts.
   * @param index The current index of the post.
   */
  Render_Post(posts, index) {
    if (index < posts.length) {
      let post = posts[index].split(/:/);
      let title = post[0];
      let author = post[1];
      let post_id = post[2];
      let self = this;
      let post_file = new frankusFile("Board/Post_" + post_id + ".txt");
      post_file.on_read = function() {
        let body = post_file.data;
        // Do the actual rendering of the post.
        let post_board = self.Create_Element({
          id: self.entity.id + "_post_board_" + index,
          type: "div",
          text: "@" + title + "@" + "*by " + author + "*\n\n" + body,
          css: {
            "padding": "4px",
            "margin": "1px",
            "margin-bottom": "8px",
            "width": "calc(100% - 10px)",
            "background-color": "#f7fbff",
            "color": "black",
            "box-shadow": "2px 2px 2px gray",
            "overflow": "auto",
            "position": "relative"
          },
          subs: [
            self.Make_Button(self.entity.id + "_edit_post_" + index, {
              "label": "Edit",
              "bg-color": "#3a654f",
              "fg-color": "white",
              "right": 4,
              "top": 4,
              "width": 50,
              "height": 20,
              "opacity": 0.7
            })
          ]
        }, self.entity.id + "_topic_area");
        // Attach post ID.
        self.elements[self.entity.id + "_edit_post_" + index].frankus_post_id = post_id;
        // Load the post images for processing.
        self.Load_Post_Images(post_board);
        // Handle edit click event.
        self.elements[self.entity.id + "_edit_post_" + index].addEventListener("click", function(event) {
          if (!self.rendering) {
            let pboard = event.target;
            if (pboard.frankus_post_id) {
              self.current_post = pboard.frankus_post_id;
              self.Toggle_Edit_Form(true, pboard.frankus_post_id);
            }
          }
        }, false);
        // Display the next post.
        self.Render_Post(posts, index + 1);
      };
      post_file.on_not_found = function() {
        self.rendering = false; // Error so rendering stopped.
      };
      post_file.Read();
    }
    else {
      this.rendering = false;
    }
  }
  
  /**
   * Toggles the message board display.
   * @param show True to show, false to hide.
   */
  Toggle_Board(show) {
    if (show) {
      this.Show(this.entity.id + "_topic_board");
      this.Show(this.entity.id + "_new_topic");
      this.Hide(this.entity.id + "_topic_reply_box");
      this.Hide(this.entity.id + "_reply_post");
      this.Hide(this.entity.id + "_disp_topics");
      this.Hide(this.entity.id + "_print");
      this.Display_Topics();
    }
    else {
      this.Hide(this.entity.id + "_topic_board");
      this.Show(this.entity.id + "_topic_reply_box");
    }
  }
  
  /**
   * Toggles the thread to display.
   * @param show True to show, false to hide.
   * @param thread_id The ID of the thread to display.
   */
  Toggle_Thread(show, thread_id) {
    if (show) {
      this.Show(this.entity.id + "_topic_board");
      this.Show(this.entity.id + "_reply_post");
      this.Show(this.entity.id + "_disp_topics");
      this.Show(this.entity.id + "_reply_post");
      this.Hide(this.entity.id + "_print");
      this.Hide(this.entity.id + "_topic_reply_box");
      this.Display_Posts(thread_id);
    }
    else {
      this.Hide(this.entity.id + "_topic_board");
      this.Show(this.entity.id + "_topic_reply_box");
    }
  }
  
  /**
   * Toggles the topic form.
   * @param show True to show, false to hide.
   */
  Toggle_Topic_Form(show) {
    if (show) {
      this.Show(this.entity.id + "_topic_reply_box");
      this.Show(this.entity.id + "_topic_form_area");
      this.Show(this.entity.id + "_post_form_area");
      this.Show(this.entity.id + "_post_topic");
      this.Show(this.entity.id + "_cancel_topic");
      this.Hide(this.entity.id + "_topic_board");
      this.Hide(this.entity.id + "_post_reply");
      this.Hide(this.entity.id + "_cancel_reply");
      this.Hide(this.entity.id + "_post_edit");
      this.Hide(this.entity.id + "_cancel_edit");
      this.Hide(this.entity.id + "_print");
      // Set screen name.
      let screen_name = localStorage.getItem("screen_name");
      if (screen_name) {
        this.elements[this.entity.id + "_screen_name"].value = screen_name;
      }
      else {
        this.elements[this.entity.id + "_screen_name"].value = "";
      }
      // Clear out fields.
      this.elements[this.entity.id + "_topic_title"].value = "";
      this.elements[this.entity.id + "_topic_post"].value = "";
    }
    else {
      this.Hide(this.entity.id + "_topic_reply_box");
    }
  }
  
  /**
   * Toggles the post form.
   * @param show True to show, false to hide.
   */
  Toggle_Post_Form(show) {
    if (show) {
      this.Show(this.entity.id + "_topic_reply_box");
      this.Show(this.entity.id + "_post_form_area");
      this.Show(this.entity.id + "_topic_form_area");
      this.Show(this.entity.id + "_post_reply");
      this.Show(this.entity.id + "_cancel_reply");
      this.Hide(this.entity.id + "_topic_board");
      this.Hide(this.entity.id + "_post_topic");
      this.Hide(this.entity.id + "_cancel_topic");
      this.Hide(this.entity.id + "_post_edit");
      this.Hide(this.entity.id + "_cancel_edit");
      this.Hide(this.entity.id + "_print");
      // Set screen name.
      let screen_name = localStorage.getItem("screen_name");
      if (screen_name) {
        this.elements[this.entity.id + "_screen_name"].value = screen_name;
      }
      else {
        this.elements[this.entity.id + "_screen_name"].value = "";
      }
      // Clear out fields.
      this.elements[this.entity.id + "_topic_title"].value = "";
      this.elements[this.entity.id + "_topic_post"].value = "";
    }
    else {
      this.Hide(this.entity.id + "_topic_reply_box");
    }
  }

  /**
   * Toggles a post form but with edit buttons and content displayed.
   * @param show True to show, false to hide.
   * @param post_id Identifies the post to edit.
   */  
  Toggle_Edit_Form(show, post_id) {
    if (show) {
      this.Show(this.entity.id + "_topic_reply_box");
      this.Show(this.entity.id + "_post_form_area");
      this.Show(this.entity.id + "_post_edit");
      this.Show(this.entity.id + "_cancel_edit");
      this.Hide(this.entity.id + "_topic_board");
      this.Hide(this.entity.id + "_topic_form_area");
      this.Hide(this.entity.id + "_post_reply");
      this.Hide(this.entity.id + "_cancel_reply");
      this.Hide(this.entity.id + "_post_topic");
      this.Hide(this.entity.id + "_cancel_topic");
      this.Hide(this.entity.id + "_print");
      // Set screen name.
      let screen_name = localStorage.getItem("screen_name");
      if (screen_name) {
        this.elements[this.entity.id + "_screen_name"].value = screen_name;
      }
      else {
        this.elements[this.entity.id + "_screen_name"].value = "";
      }
      // Load post.
      let self = this;
      this.rendering = true;
      let post_file = new frankusFile("Board/Post_" + post_id + ".txt");
      post_file.on_read = function() {
        let body = post_file.data;
        self.elements[self.entity.id + "_topic_post"].value = body;
        self.rendering = false;
      };
      post_file.on_not_found = function() {
        self.elements[self.entity.id + "_topic_post"].value = "";
        self.rendering = false;
      };
      post_file.Read();
    }
    else {
      this.Hide(this.entity.id + "_topic_reply_box");
    }
  }
  
  /**
   * Posts a new topic to the board. Validation is performed too.
   * @param screen_name A screen name of your choosing to identify yourself.
   * @param topic_title A short description of the topic.
   * @param topic_post The body of the topic. This will be the first post.
   * @param on_post Called when topic is done posting.
   */
  Post_Topic(screen_name, topic_title, topic_post, on_post) {
    if ((screen_name.value.length > 0) && (topic_title.value.length > 0) && (topic_post.value.length > 0)) {
      localStorage.setItem("screen_name", screen_name.value);
      // Generate thread id and post id.
      let date = new Date();
      let thread_id = Frankus_String_To_Hex(topic_title.value + date.getTime());
      let post_id = Frankus_String_To_Hex(topic_title.value + date.getTime());
      // Add to topics file.
      this.rendering = true;
      let topics_file = new frankusFile("Board/Topics.txt");
      let self = this;
      topics_file.on_read = function() {
        let topics = topics_file.lines;
        topics.push(topic_title.value + ":" + thread_id + ":active");
        let topics_save = new frankusFile("Board/Topics.txt");
        topics_save.lines = topics;
        topics_save.on_write = function() {
          let thread_save = new frankusFile("Board/Thread_" + thread_id + ".txt");
          thread_save.data = topic_title.value + ":" + screen_name.value + ":" + post_id;
          thread_save.on_write = function() {
            let post_save = new frankusFile("Board/Post_" + post_id + ".txt");
            post_save.data = topic_post.value;
            post_save.on_write = function() {
              on_post();
              self.rendering = false;
            };
            post_save.on_not_found = function() {
              on_post();
              self.rendering = false;
            };
            post_save.Write();
          };
          thread_save.on_not_found = function() {
            on_post();
            self.rendering = false;
          };
          thread_save.Write();
        };
        topics_save.on_not_found = function() {
          on_post();
          self.rendering = false;
        };
        topics_save.Write();
      };
      topics_file.on_not_found = function() {
        let topics_save = new frankusFile("Board/Topics.txt", topic_title.value + ":" + thread_id + ":active");
        topics_save.on_write = function() {
          let thread_save = new frankusFile("Board/Thread_" + thread_id + ".txt");
          thread_save.data = topic_title.value + ":" + screen_name.value + ":" + post_id;
          thread_save.on_write = function() {
            let post_save = new frankusFile("Board/Post_" + post_id + ".txt");
            post_save.data = topic_post.value;
            post_save.on_write = function() {
              on_post();
              self.rendering = false;
            };
            post_save.on_not_found = function() {
              on_post();
              self.rendering = false;
            };
            post_save.Write();
          };
          thread_save.on_not_found = function() {
            on_post();
            self.rendering = false;
          };
          thread_save.Write();
        };
        topics_save.on_not_found = function() {
          on_post();
          self.rendering = false;
        };
        topics_save.Write();
      };
      topics_file.Read();
    }
    else {
      if (screen_name.value.length == 0) {
        screen_name.focus();
      }
      if (topic_title.value.length == 0) {
        topic_title.focus();
      }
      if (topic_post.value.length == 0) {
        topic_post.focus();
      }
    }
  }
  
  /**
   * Posts a new reply to a thread. Validation is performed too.
   * @param thread_id The ID of the thread to post to.
   * @param screen_name A screen name of your choosing to identify yourself.
   * @param topic_title A short description of the reply.
   * @param topic_post The body of the reply.
   * @param on_post Called when reply is done posting.
   */
  Post_Reply(thread_id, screen_name, topic_title, topic_post, on_post) {
    if ((screen_name.value.length > 0) && (topic_title.value.length > 0) && (topic_post.value.length > 0)) {
      localStorage.setItem("screen_name", screen_name.value);
      // Generate post id.
      let date = new Date();
      let post_id = Frankus_String_To_Hex(topic_title.value + date.getTime());
      this.rendering = true;
      let thread_file = new frankusFile("Board/Thread_" + thread_id + ".txt");
      let self = this;
      thread_file.on_read = function() {
        let posts = thread_file.lines;
        posts.push(topic_title.value + ":" + screen_name.value + ":" + post_id);
        let thread_save = new frankusFile("Board/Thread_" + thread_id + ".txt");
        thread_save.lines = posts;
        thread_save.on_write = function() {
          let post_save = new frankusFile("Board/Post_" + post_id + ".txt");
          post_save.data = topic_post.value;
          post_save.on_write = function() {
            on_post();
            self.rendering = false;
          };
          post_save.on_not_found = function() {
            on_post();
            self.rendering = false;
          };
          post_save.Write();
        };
        thread_save.on_not_found = function() {
          on_post();
          self.rendering = false;
        };
        thread_save.Write();
      };
      thread_file.on_not_found = function() {
        on_post();
        self.rendering = false;
      };
      thread_file.Read();
    }
    else {
      if (screen_name.value.length == 0) {
        screen_name.focus();
      }
      if (topic_title.value.length == 0) {
        topic_title.focus();
      }
      if (topic_post.value.length == 0) {
        topic_post.focus();
      }
    }
  }
  
  /**
   * Updates a post. Validation is performed too.
   * @param post_id The ID of the post to edit.
   * @param screen_name A screen name of your choosing to identify yourself.
   * @param topic_post The body of the post.
   * @param on_post Called when post is complete.
   */
  Post_Edit(post_id, screen_name, topic_post, on_post) {
    if ((screen_name.value.length > 0) && (topic_post.value.length > 0)) {
      localStorage.setItem("screen_name", screen_name.value);
      this.rendering = true;
      let self = this;
      let post_save = new frankusFile("Board/Post_" + post_id + ".txt");
      post_save.data = topic_post.value;
      post_save.on_write = function() {
        on_post();
        self.rendering = false;
      };
      post_save.on_not_found = function() {
        on_post();
        self.rendering = false;
      };
      post_save.Write();
    }
    else {
      if (screen_name.value.length == 0) {
        screen_name.focus();
      }
      if (topic_post.value.length == 0) {
        topic_post.focus();
      }
    }
  }

  /**
   * Loads all images of the post. Focuses on Frankus pictures.
   * @param container The associated post container.
   */
  Load_Post_Images(container) {
    let images = container.getElementsByTagName("img");
    let image_count = images.length;
    for (let image_index = 0; image_index < image_count; image_index++) {
      let image = images[image_index];
      image.onload = function(event) {
        let img = event.target;
        if (img.width > container.clientWidth) {
          img.setAttribute("class", "Wiki_Image");
          img.frankus_resizable = true;
        }
      };
    }
  }

}

// =============================================================================
// Frankus Chat
// =============================================================================

/**
 * Creates a chat. This consists of a chat display pane 
 * and a write box. Again, like the message board you must
 * input the editor code to write to it.
 */
class frankusChat extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.timer = null;
    this.queried_files = [ "refresh" ];
    this.Create();
  }
  
  Create() {
    let chat_outer = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": this.entity.x + "px",
        "top": this.entity.y + "px",
        "width": this.entity.width + "px",
        "height": this.entity.height + "px"
      },
      subs: [
        {
          id: this.entity.id + "_message_box",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "calc(100% - 10px)",
            "height": "calc(100% - 104px - 10px)",
            "padding": "5px",
            "overflow": "scroll",
            "background-color": "#FDFEFE",
            "font": this.settings["font"] || "Regular, sans-serif"
          }
        },
        {
          id: this.entity.id + "_screen_name_area",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "calc(100% - 104px)",
            "width": "100%",
            "height": "24px",
          },
          subs: [
            this.Make_Form(this.entity.id + "_screen_name_form", [
              this.Make_Field(this.entity.id + "_screen_name", {
                "label": "Screen Name",
                "height": 24
              })
            ])
          ]
        },
        {
          id: this.entity.id + "_message_area",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "calc(100% - 104px + 24px)",
            "width": "100%",
            "height": "56px",
          },
          subs: [
            this.Make_Form(this.entity.id + "_message_form", [
              this.Make_Edit(this.entity.id + "_message", {
                "label": "Type in your message here."
              })
            ])
          ]
        },
        {
          id: this.entity.id + "_post_area",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "calc(100% - 104px + 24px + 56px)",
            "width": "100%",
            "height": "24px"
          },
          subs: [
            this.Make_Button(this.entity.id + "_post", {
              "label": "Post",
              "top": 0,
              "right": 0,
              "fg-color": "white",
              "bg-color": "lightblue",
              "width": 80,
              "height": 24
            }),
            this.Make_Button(this.entity.id + "_clear", {
              "label": "Clear",
              "top": 0,
              "left": 0,
              "fg-color": "white",
              "bg-color": "lightgreen",
              "width": 80,
              "height": 24
            })
          ]
        }
      ]
    }, this.container);
    let self = this;
    let message_box = this.elements[this.entity.id + "_message"];
    let screen_name = this.elements[this.entity.id + "_screen_name"];
    screen_name.addEventListener("focus", function(event) {
      screen_name.select();
    }, false);
    this.elements[this.entity.id + "_post"].addEventListener("click", function(event) {
      clearInterval(self.timer);
      self.Post_Message(message_box, screen_name, function(message) {
        console.log(message);
        self.Display_Chats();
        message_box.value = "";
        // Save the screen name.
        localStorage.setItem("screen_name", screen_name.value);
        self.timer = setInterval(function() {
          self.Display_Chats();
        }, 5000);
      }, function(error) {
        console.log(error);
      });
    }, false);
    this.elements[this.entity.id + "_clear"].addEventListener("click", function(event) {
      message_box.value = "";
    }, false);
    // Set up chat display.
    this.Display_Chats();
    this.timer = setInterval(function() {
      self.Display_Chats();
    }, 5000);
    // Load screen name value.
    if (localStorage.getItem("screen_name") != null) {
      screen_name.value = localStorage.getItem("screen_name");
    }
  }
  
  /**
   * Pauses the execution of the timer.
   */
  Pause() {
    clearInterval(this.timer);
    // this.timer = null;
  }
  
  /**
   * Resumes execution of the timer.
   */
  Resume() {
    let self = this;
    this.timer = setInterval(function() {
      self.Display_Chats();
    }, 5000);
  }
  
  /**
   * Posts a message to the chat.
   * @param message The message object to post to.
   * @param screen_name The screen name object identifying the user.
   * @param on_post Called if the message was posted. The success message is passed in.
   * @param on_error Called if the message was not posted. The error message is passed in.
   */
  Post_Message(message, screen_name, on_post, on_error) {
    if ((message.value.length > 0) && (screen_name.value.length > 0)) {
      let date = new Date();
      let time_stamp = date.getTime();
      let post_id = "Chat_" + time_stamp;
      let body = "@" + screen_name.value + "@" + message.value;
      let save_file = new frankusFile("Chat/" + post_id + ".txt");
      save_file.data = body;
      save_file.on_write = on_post;
      save_file.on_not_found = on_error;
      save_file.Write();
    }
  }
  
  /**
   * Displays all entered chats that are recent.
   */
  Display_Chats() {
    let self = this;
    frankusFile.Query_Files("@Chat_", "Chat", function(files) {
      // Scrub files.
      let file_count = files.length;
      files.sort(function(a, b) {
        b = parseInt(b.replace(/^Chat_/, "").replace(/\.txt$/, ""));
        a = parseInt(a.replace(/^Chat_/, "").replace(/\.txt$/, ""));
        return b - a;
      });
      files.reverse();
      files = files.slice(0, 50);
      if (self.queried_files.length != files.length) {
        self.queried_files = files.slice(0);
        self.Remove_Elements(self.elements[self.entity.id + "_message_box"]);
        self.Display_Chat(files, 0, function() {
          setTimeout(function() {
            self.elements["chat_message_box"].scrollTop = self.elements["chat_message_box"].scrollHeight;
          }, 500);
        });
      }
    });
  }
  
  /**
   * Displays a chat from a file using the index.
   * @param files The files containing the chats.
   * @param index The index of the chat.
   * @param on_display Called when the chat is done displaying.
   */
  Display_Chat(files, index, on_display) {
    if (index < files.length) {
      let file = files[index];
      let self = this;
      let chat_file = new frankusFile("Chat/" + file);
      chat_file.on_read = function() {
        let panel = self.Create_Element({
          id: self.entity.id + "_panel_" + index,
          type: "div",
          text: chat_file.data,
          css: {
            "margin-bottom": "16px",
            "border-bottom": "1px dashed gray",
            "padding-bottom": "8px"
          }
        }, self.entity.id + "_message_box");
        self.Display_Chat(files, index + 1, on_display);
      };
      chat_file.on_not_found = function() {
        let error_box = self.Create_Element({
          id: self.entity.id + "_error_box_" + index,
          type: "div",
          text: "Could not load chat.",
          css: {
            "color": "red",
            "font-weight": "bold",
            "margin-bottom": "16px",
            "border-bottom": "1px dashed gray",
            "padding-bottom": "8px"
          }
        }, self.entity.id + "_message_box");
        self.Display_Chat(files, index + 1, on_display);
      };
      chat_file.Read();
    }
    else {
      on_display();
    }
  }

}

// =============================================================================
// Frankus Uploader
// =============================================================================

/**
 * The uploader allows uploading of files to the server if the editor code is
 * set.
 */
class frankusUploader extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.folder = "Images";
    this.callback = function() {
      console.log("Files are uploaded.");
    };
    this.mime = {};
    this.loaded = false;
    this.Create();
  }

  Create() {
    let layout = this.Create_Element({
      id: this.entity.id + "_form",
      type: "form",
      attrib: {
        action: ""
      },
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "margin": "0",
        "padding": "0"
      },
      subs: [
        {
          id: this.entity.id,
          type: "input",
          attrib: {
            type: "file",
            multiple: ""
          },
          css: {
            "visibility": "hidden",
            "width": "100%"
          }
        },
        this.Make_Button(this.entity.id + "_upload", {
          "left": 0,
          "top": 0,
          "width": this.entity.width - 2,
          "height": this.entity.height - 2,
          "label": "Upload",
          "bg-color": "lightgreen"
        })
      ]
    }, this.container);
    // Handle uploads.
    let self = this;
    this.elements[this.entity.id + "_upload"].addEventListener("click", function(event) {
      if (self.loaded) {
        self.elements[self.entity.id].click(); // Invoke click on file browser.
      }
    }, false);
    this.elements[this.entity.id].addEventListener("change", function(event) {
      let files = self.elements[self.entity.id].files;
      self.Handle_File(files, 0, self.callback);
    }, false);
    // Load MIME types.
    let mime_file = new frankusFile("Config/Mime.txt");
    mime_file.on_read = function() {
      let records = mime_file.lines;
      let rec_count = records.length;
      for (let rec_index = 0; rec_index < rec_count; rec_index++) {
        let record = records[rec_index].split(/=/);
        if (record.length == 2) {
          let ext = record[0];
          let pair = record[1].split(/,/);
          if (pair.length == 2) {
            let mime_type = pair[0];
            let binary = (pair[1] == "true");
            self.mime[ext] = {
              type: mime_type,
              binary: binary
            };
          }
        }
      }
      self.loaded = true;
    };
    mime_file.Read();
  }

  /**
   * Handles a file upload given a list of files.
   * @param files The file objects.
   * @param index The index of the file to upload.
   * @param on_upload Called when all the files have been uploaded.
   */
  Handle_File(files, index, on_upload) {
    try {
      if (index < files.length) {
        let self = this;
        let file = files[index];
        let name = file.name;
        let ext = frankusFile.Get_Extension(name);
        let mime = self.mime[ext];
        Frankus_Check_Condition((mime != undefined), "File type " + ext + " is not defined.");
        let reader = new FileReader();
        reader.onload = function(event) {
          let data = (!mime.binary) ? event.target.result : event.target.result.split(/,/).pop(); // We're getting the Base64 string.
          let save_file = new frankusFile(self.folder + "/" + name);
          save_file.data = data;
          save_file.on_write = function() {
            console.log(save_file.message);
            self.Handle_File(files, index + 1, on_upload);
          };
          save_file.Write_Direct(); // Write file directly to server.
        };
        if (!mime.binary) { // Read text files as text only!
          reader.readAsText(file);
        }
        else {
          reader.readAsDataURL(file);
        }
      }
      else {
        on_upload();
      }
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Sets the folder for the uploader.
   * @param folder The folder to set.
   */
  Set_Folder(folder) {
    this.folder = folder;
  }

  On(name, handler) {
    if (name == "upload") {
      this.callback = handler;
    }
  }

}

// =============================================================================
// Frankus Link
// =============================================================================

/**
 * The link is basically a hyperlink. The following
 * properties can be set:
 *
 * - label - The text to display for the link.
 * - href - Can point to a page or an external link.
 * - color - The color of the hyperlink.
 * - hover - The color when the link is hovered.
 */
class frankusLink extends frankusComponent {

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.Create();
  }
  
  Create() {
    let link = this.Create_Element({
      id: this.entity.id,
      type: "div",
      text: this.settings["label"],
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px",
        "text-align": "center",
        "line-height": String(this.entity.height - 2) + "px",
        "color": this.settings["color"],
        "font-weight": "bold"
      }
    }, this.container);
    let self = this;
    link.addEventListener("mouseover", function(event) {
      link.style.color = self.settings["hover"];
    }, false);
    link.addEventListener("mouseout", function(event) {
      link.style.color = self.settings["color"];
    }, false);
    link.addEventListener("click", function(event) {
      let link = self.settings["href"];
      if (link.match(/^\[[^\]]+\]$/)) {
        let url = frankus_http + link.replace(/^\[([^\]]+)\]$/, "$1");
        window.open(url);
      }
      else {
        if (frankus_layout) {
          frankus_layout.Flip_Page(link);
        }
      }
    }, false);
  }

}

/**
 * This is a color picker where you can pick colors for painting
 * or something else. The properties are as follows:
 *
 * - file - The file to load/save the colors to.
 */
class frankusColor_Picker extends frankusComponent {

  COLOR_W = 32;
  COLOR_H = 32;
  MAX_COLORS = 93; // All ASCII characters.
  PADDING = 2;
  GROW = 16;

  constructor(entity, settings, container) {
    super(entity, settings, container);
    this.colors = {};
    this.color_names = [];
    this.color_hashes = {};
    this.color_x = 0;
    this.color_y = 0;
    this.sel_color = '';
    this.Create();
  }
  
  Create() {
    let color_container = this.Create_Element({
      id: this.entity.id,
      type: "div",
      css: {
        "position": "absolute",
        "left": String(this.entity.x + 1) + "px",
        "top": String(this.entity.y + 1) + "px",
        "width": String(this.entity.width - 2) + "px",
        "height": String(this.entity.height - 2) + "px"
      },
      subs: [
        {
          id: this.entity.id + "_color_board",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": "100%",
            "overflow": "scroll",
            "background-image": Frankus_Get_Image("Checkers.png", true),
            "cursor": Frankus_Get_Image("Brush.png", true)
          }
        },
        {
          id: this.entity.id + "_color_editor",
          type: "div",
          css: {
            "position": "absolute",
            "left": "0",
            "top": "0",
            "width": "100%",
            "height": "100%",
            "background-color": "white",
            "display": "none"
          },
          subs: [
            this.Make_Form(this.entity.id + "_color_ranger", [
              {
                id: this.entity.id + "_red",
                type: "input",
                attrib: {
                  type: "range",
                  min: "0",
                  max: "255",
                  value: "0",
                  step: "1",
                  orient: "vertical"
                },
                css: {
                  "border": "0",
                  "padding": "0",
                  "margin": "2px",
                  "height": "80%",
                  "cursor": Frankus_Get_Image("Cursor.png", true) + ", default",
                  "background-image": Frankus_Get_Image("Range.png", true)
                }
              },
              {
                id: this.entity.id + "_green",
                type: "input",
                attrib: {
                  type: "range",
                  min: "0",
                  max: "255",
                  value: "0",
                  step: "1",
                  orient: "vertical"
                },
                css: {
                  "border": "0",
                  "padding": "0",
                  "margin": "2px",
                  "height": "80%",
                  "cursor": Frankus_Get_Image("Cursor.png", true) + ", default",
                  "background-image": Frankus_Get_Image("Range.png", true)
                }
              },
              {
                id: this.entity.id + "_blue",
                type: "input",
                attrib: {
                  type: "range",
                  min: "0",
                  max: "255",
                  value: "0",
                  step: "1",
                  orient: "vertical"
                },
                css: {
                  "border": "0",
                  "padding": "0",
                  "margin": "2px",
                  "height": "80%",
                  "cursor": Frankus_Get_Image("Cursor.png", true) + ", default",
                  "background-image": Frankus_Get_Image("Range.png", true)
                }
              },
              {
                id: this.entity.id + "_alpha",
                type: "input",
                attrib: {
                  type: "range",
                  min: "0",
                  max: "1",
                  value: "0",
                  step: "0.1",
                  orient: "vertical"
                },
                css: {
                  "border": "0",
                  "padding": "0",
                  "margin": "2px",
                  "height": "80%",
                  "cursor": Frankus_Get_Image("Cursor.png", true) + ", default",
                  "background-image": Frankus_Get_Image("Range.png", true)
                }
              },
              this.Make_Field(this.entity.id + "_letter", {
                "type": "text",
                "object-width": "32px",
                "object-height": "32px"
              })
            ]),
            {
              id: this.entity.id + "_preview",
              type: "div",
              css: {
                "position": "absolute",
                "right": "5px",
                "top": "5px",
                "width": "64px",
                "height": "64px",
                "background-color": "transparent"
              }
            },
            this.Make_Button(this.entity.id + "_save", {
              "label": "Save",
              "bg-color": "lightgreen",
              "right": 74,
              "top": 5,
              "width": 64,
              "height": 24,
              "position": "absolute"
            }),
            this.Make_Button(this.entity.id + "_cancel", {
              "label": "Cancel",
              "bg-color": "lightblue",
              "right": 74,
              "top": 34,
              "width": 64,
              "height": 24,
              "position": "absolute"
            })
          ]
        }
      ]
    }, this.container);
    // Handler color rangers.
    let self = this;
    this.elements[this.entity.id + "_red"].addEventListener("input", function(event) {
      let red = event.target.value;
      let green = self.elements[self.entity.id + "_green"].value;
      let blue = self.elements[self.entity.id + "_blue"].value;
      let alpha = self.elements[self.entity.id + "_alpha"].value;
      self.elements[self.entity.id + "_preview"].style.backgroundColor = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }, false);
    this.elements[this.entity.id + "_green"].addEventListener("input", function(event) {
      let green = event.target.value;
      let red = self.elements[self.entity.id + "_red"].value;
      let blue = self.elements[self.entity.id + "_blue"].value;
      let alpha = self.elements[self.entity.id + "_alpha"].value;
      self.elements[self.entity.id + "_preview"].style.backgroundColor = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }, false);
    this.elements[this.entity.id + "_blue"].addEventListener("input", function(event) {
      let blue = event.target.value;
      let green = self.elements[self.entity.id + "_green"].value;
      let red = self.elements[self.entity.id + "_red"].value;
      let alpha = self.elements[self.entity.id + "_alpha"].value;
      self.elements[self.entity.id + "_preview"].style.backgroundColor = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }, false);
    this.elements[this.entity.id + "_alpha"].addEventListener("input", function(event) {
      let alpha = event.target.value;
      let green = self.elements[self.entity.id + "_green"].value;
      let blue = self.elements[self.entity.id + "_blue"].value;
      let red = self.elements[self.entity.id + "_red"].value;
      self.elements[self.entity.id + "_preview"].style.backgroundColor = "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }, false);
    this.elements[this.entity.id + "_color_board"].addEventListener("dblclick", function(event) {
      self.elements[self.entity.id + "_letter"].value = "";
      self.elements[self.entity.id + "_red"].value = 0;
      self.elements[self.entity.id + "_green"].value = 0;
      self.elements[self.entity.id + "_blue"].value = 0;
      self.elements[self.entity.id + "_alpha"].value = 0;
      self.elements[self.entity.id + "_preview"].style.backgroundColor = "rgba(0, 0, 0, 0)";
      self.Show(self.entity.id + "_color_editor");
    }, false);
    this.elements[this.entity.id + "_save"].addEventListener("click", function(event) {
      let letter = self.elements[self.entity.id + "_letter"].value;
      if (letter.length == 1) {
        let code = letter.charCodeAt(0);
        if ((code > 32) && (code < 127)) { // ! to ~
          let alpha = self.elements[self.entity.id + "_alpha"].value;
          let green = self.elements[self.entity.id + "_green"].value;
          let blue = self.elements[self.entity.id + "_blue"].value;
          let red = self.elements[self.entity.id + "_red"].value;
          self.Add(letter, red, green, blue, alpha);
          if (self.settings["file"]) {
            self.Save(self.settings["file"]);
          }
          self.Hide(self.entity.id + "_color_editor");
        }
      }
    }, false);
    this.elements[this.entity.id + "_cancel"].addEventListener("click", function(event) {
      self.elements[self.entity.id + "_letter"].value = "";
      self.elements[self.entity.id + "_red"].value = 0;
      self.elements[self.entity.id + "_green"].value = 0;
      self.elements[self.entity.id + "_blue"].value = 0;
      self.elements[self.entity.id + "_alpha"].value = 0;
      self.elements[self.entity.id + "_preview"].style.backgroundColor = "rgba(0, 0, 0, 0)";
      self.Hide(self.entity.id + "_color_editor");
    }, false);
    // Load palette if present.
    if (this.settings["file"]) {
      this.Load(this.settings["file"]);
    }
  }
  
  /**
   * Adds a new color to the picker.
   * @param letter The associated letter.
   * @param red The red component.
   * @param green The green component.
   * @param blue The blue component.
   * @param alpha The alpha component. Range from 0 to 1.
   */
  Add(letter, red, green, blue, alpha) {
    if (this.colors[letter] == undefined) {
      if (this.color_names.length < this.MAX_COLORS) {
        this.color_names.push(letter);
        let color_id = this.color_names.length - 1;
        this.colors[letter] = {
          red: parseInt(red),
          green: parseInt(green),
          blue: parseInt(blue),
          alpha: parseFloat(alpha),
          id: color_id
        };
        // Calculate color hash.
        let hash = [ red, green, blue, alpha ].join(":");
        this.color_hashes[hash] = letter;
        let color = this.Create_Element({
          id: this.entity.id + "_color_" + color_id,
          type: "div",
          css: {
            "position": "absolute",
            "left": this.color_x + "px",
            "top": this.color_y + "px",
            "width": this.COLOR_W + "px",
            "height": this.COLOR_H + "px",
            "background-color": "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")",
            "box-shadow": "1px 1px 1px gray",
            "border-radius": "2px solid black"
          }
        }, this.entity.id + "_color_board");
        this.color_x += (this.COLOR_W + this.PADDING);
        let limit = this.entity.width - 2 - this.COLOR_W;
        if (this.color_x >= limit) {
          this.color_x = 0;
          this.color_y += (this.COLOR_H + this.PADDING);
        }
        color.frankus_id = letter;
        let self = this;
        color.addEventListener("click", function(event) {
          self.Select_Color(event.target.frankus_id);
          event.stopPropagation();
        }, false);
        color.addEventListener("dblclick", function(event) {
          let entry = self.colors[event.target.frankus_id];
          self.elements[self.entity.id + "_red"].value = entry.red;
          self.elements[self.entity.id + "_green"].value = entry.green;
          self.elements[self.entity.id + "_blue"].value = entry.blue;
          self.elements[self.entity.id + "_alpha"].value = entry.alpha;
          self.elements[self.entity.id + "_letter"].value = event.target.frankus_id;
          self.elements[self.entity.id + "_preview"].style.backgroundColor = "rgba(" + entry.red + ", " + entry.green + ", " + entry.blue + ", " + entry.alpha + ")";
          self.Show(self.entity.id + "_color_editor");
          event.stopPropagation();
        }, false);
      }
    }
  }
  
  /**
   * Selects a color to be used.
   * @param selected_color The value of the selected color.
   */
  Select_Color(selected_color) {
    this.sel_color = selected_color;
    let color = this.colors[selected_color];
    let brush_image = new Image();
    let self = this;
    brush_image.onload = function() {
      if (color.alpha > 0.0) {
        brush_image.Fill_Colored(0, 0, 10, 10, {
          red: color.red,
          green: color.green,
          blue: color.blue,
          alpha: color.alpha
        });
      }
      let url = brush_image.Get_Data_URL();
      self.elements[self.entity.id + "_color_board"].style.cursor = 'url("' + url + '"), default';
    };
    brush_image.src = Frankus_Get_Image("Brush.png", false);
  }
  
  /**
   * Loads the colors from a palette.
   * @param name The name of the palette.
   */
  Load(name) {
    let file = new frankusFile("Palette/" + name + ".txt");
    let self = this;
    file.on_read = function() {
      while (file.Has_More_Lines()) {
        let line = file.Get_Line();
        let parts = line.split(/,/);
        if (parts.length == 5) { // letter,red,green,blue,alpha
          let letter = parts[0];
          if (letter.length == 1) {
            let code = letter.charCodeAt(0);
            if ((code > 32) && (code < 127)) { // ! to ~
              let red = parts[1];
              let green = parts[2];
              let blue = parts[3];
              let alpha = parts[4];
              self.Add(letter, red, green, blue, alpha);
            }
          }
        }
      }
    };
    file.Read();
  }
  
  /**
   * Saves colors to a palette file.
   * @param name The name of the palette file.
   */
  Save(name) {
    let file = new frankusFile("Palette/" + name + ".txt");
    let color_count = this.color_names.length;
    for (let color_index = 0; color_index < color_count; color_index++) {
      let letter = this.color_names[color_index];
      let color = this.colors[letter];
      file.Add(letter + "," + color.red + "," + color.green + "," + color.blue + "," + color.alpha);
    }
    file.Write();
  }
  
}

// =============================================================================
// Frankus Routines
// =============================================================================

/**
 * Splits text into lines regardless of the line endings.
 * @param data The text to be split.
 * @return An array of string representing the lines.
 */
function Frankus_Split(data) {
  let lines = data.split(/\r\n|\r|\n/);
  // Remove any carrage return at the end.
  let line_count = lines.length;
  let blanks = 0;
  for (let line_index = line_count - 1; line_index >= 0; line_index--) { // Start from back.
    let line = lines[line_index];
    if (line.length == 0) {
      blanks++;
    }
    else {
      break;
    }
  }
  return lines.slice(0, line_count - blanks);
}

/**
 * Checks a condition to see if it passes otherwise an error is thrown.
 * @param condition The condition to check. 
 * @param error An error message for the condition fails.
 * @throws An error if the condition fails. 
 */
function Frankus_Check_Condition(condition, error) {
  if (!condition) {
    throw new Error(error);
  }
}

/**
 * Converts a string into hex format.
 * @param string The string to convert.
 * @return The hex string.
 */
function Frankus_String_To_Hex(string) {
  let hex_str = "";
  let length = string.length;
  for (let ch_index = 0; ch_index < length; ch_index++) {
    let ch_value = string.charCodeAt(ch_index);
    let hex_value = ch_value.toString(16).toUpperCase();
    if (hex_value.length == 1) {
      hex_value = "0" + hex_value;
    }
    hex_str += hex_value;
  }
  return hex_str;
}

/**
 * Converts hex to a string.
 * @param hex_str The hex string.
 * @return The restored string.
 */
function Frankus_Hex_To_String(hex_str) {
  let string = "";
  let length = hex_str.length;
  for (let hex_index = 0; hex_index < length; hex_index += 2) {
    let hex_value = hex_str.substr(hex_index, 2);
    let ch_value = String.fromCharCode(parseInt(hex_value, 16));
    string += ch_value;
  }
  return string;
}

/**
 * Determines if a point is in a box.
 * @param point The point to test.
 * @param box The box.
 * @return True if the point is in the box, false otherwise.
 */
function Frankus_Is_Point_In_Box(point, box) {
  let result = false;
  if ((point.x >= box.left) && (point.x <= box.right) && (point.y >= box.top) && (point.y <= box.bottom)) {
    result = true;
  }
  return result;
}

/**
 * Grabs the code of a single character.
 * @param character The character to grab the code of.
 * @return The numeric code of the character.
 */
function Frankus_Get_Char_Code(character) {
  return character.charCodeAt(0);
}

/**
 * Determines if a browser is mobile or not.
 * @return True if the browser is mobile, false otherwise.
 */
function Frankus_Is_Mobile() {
  return (screen.width <= 450);
}

/**
 * Gets the image by name.
 * @param name The name of the image to fetch.
 * @param quote If true then url will be quoted with url() modifier.
 * @param folder The folder to get the image from. This is optional. Default is "Images".
 * @return The image URL string.
 */
function Frankus_Get_Image(name, quote, folder) {
  if (folder == undefined) {
    folder = "Images";
  }
  let url = folder + "/" + name;
  if (quote) {
    url = 'url("' + url + '")';
  }
  return url;
}

/**
 * Parses the search portion of the URL.
 * @param url The URL to parse.
 * @return A hash of name/value pairs.
 */
function Frankus_Parse_URL(url) {
  let params = {};
  let pairs = url.substr(1).split(/&/);
  let pair_count = pairs.length;
  for (let pair_index = 0; pair_index < pair_count; pair_index++) {
    let pair = pairs[pair_index].split(/=/);
    if (pair.length == 2) {
      let name = pair[0];
      let value = decodeURIComponent(pair[1]);
      params[name] = value;
    }
  }
  return params;
}

/**
 * Converts a binary string to a number.
 * @param binary The binary string.
 * @return The number.
 */
function Frankus_Binary_To_Number(binary) {
  let digit_count = binary.length;
  let number = 0;
  for (let digit_index = 0; digit_index < digit_count; digit_index++) {
    let digit = parseInt(binary.charAt(digit_index));
    let bit_value = Math.pow(2, digit_count - digit_index - 1);
    number += (bit_value * digit);
  }
  return Math.floor(number);
}

/**
 * Formats text according to Wiki format.
 * @param text The wiki text to format into HTML.
 * @return HTML generated from wiki text.
 */
function Frankus_Compile_Markdown(text) {
  return text.replace(/&/g, "&amp;")
             .replace(/>/g, "&gt;")
             .replace(/</g, "&lt;")
             .replace(/\*{2}/g, "&ast;")
             .replace(/#{2}/g, "&num;")
             .replace(/@{2}/g, "&commat;")
             .replace(/\${2}/g, "&dollar;")
             .replace(/%{2}/g, "&percnt;")
             .replace(/\^{2}/g, "&Hat;")
             .replace(/\|{2}/g, "&vert;")
             .replace(/\(c\)/g, "&copy;")
             .replace(/#([^#]+)#/g, "<b>$1</b>")
             .replace(/\*([^*]+)\*/g, "<i>$1</i>")
             .replace(/@([^@]+)@/g, "<h1>$1</h1>")
             .replace(/\$([^$]+)\$/g, "<h2>$1</h2>")
             .replace(/\^([^\^]+)\^/g, '<div class="table_head">$1</div>')
             .replace(/\|([^\|]+)\|/g, '<div class="table_data">$1</div>')
             .replace(/%([^%]+)%/g, '<div class="code"><pre>$1</pre></div>')
             .replace(/`([^`]+)`/g, "<!-- $1 -->")
             .replace(/(http:\/\/\S+|https:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>')
             .replace(/image:\/\/(\S+)/g, '<img src="Images/$1" onclick="Frankus_Resize_Image(this)" alt="Image" />')
             .replace(/progress:\/\/(\d+)/g, '<div class="progress"><div class="percent_complete" style="width: $1%;">$1% Complete</div></div>')
             .replace(/video:\/\/(\S+)/g, '<iframe width="560" height="315" src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>')
             .replace(/\[ruler\]/g, "<hr />")
             .replace(/\[page\-break\]/g, '<div class="page-break"></div>')
             .replace(/\r\n|\r|\n/g, "<br />");
}

/**
 * Flushes out an object's properties without
 * deleting the object itself.
 * @param object The object.
 */
function Frankus_Clear_Object(object) {
  for (let property in object) {
    delete object[property];
  }
}

/**
 * Loads an object from the inspector.
 * @param object The object.
 * @param grid The grid component.
 */
function Frankus_Load_Object_From_Grid(object, grid) {
  Frankus_Clear_Object(object);
  let data = grid.Get_Table_Data();
  let rows = Frankus_Split(data);
  let row_count = rows.length;
  for (let row_index = 0; row_index < row_count; row_index++) {
    let columns = rows[row_index].split(/\t/);
    let name = columns[0];
    let value = columns[1];
    if (name.length > 0) { // Ignore blank names.
      object[name] = value;
    }
  }
}

/**
 * Saves an object to the inspector.
 * @param object The object.
 * @param grid The grid component.
 */
function Frankus_Save_Object_To_Grid(object, grid) {
  let data = [];
  for (let name in object) {
    let value = object[name];
    data.push(name + "\t" + value);
  }
  grid.Set_Table_Data(data.join("\n"));
}

/**
 * Checks to see if certain properties exist in the
 * object.
 * @param object The object.
 * @param properties The properties that should be on the object.
 * @throws An error if the object is missing properties.
 */
function Frankus_Check_Object_Properties(object, properties) {
  let prop_count = properties.length;
  for (let prop_index = 0; prop_index < prop_count; prop_index++) {
    let name = properties[prop_index];
    Frankus_Check_Condition((object[name] != undefined), "Missing property " + name + ".");
  }
}

/**
 * Excludes named object properties.
 * @param object The object to exclude the properties from.
 * @param properties The list of properties to exclude.
 * @return The object without the excluded properties.
 */
function Frankus_Exclude_Object_Properties(object, properties) {
  let object_without_excluded = Object.assign({}, object);
  let prop_count = properties.length;
  for (let prop_index = 0; prop_index < prop_count; prop_index++) {
    let property = properties[prop_index];
    if (object_without_excluded[property] != undefined) {
      delete object_without_excluded[property];
    }
  }
  return object_without_excluded;
}

/**
 * Resizes an image when clicked. It can be larger or smaller.
 * @param image The associated image.
 */
function Frankus_Resize_Image(image) {
  if (image.frankus_resizable) { // Resize images larger than 600 pixels.
    let class_name = image.getAttribute("class");
    if (class_name == "Wiki_Image") {
      image.setAttribute("class", "");
    }
    else {
      image.setAttribute("class", "Wiki_Image");
    }
  }
}
