// =============================================================================
// Frankus Nerd Script
// Programmed by Francois Lamini
//
// Log:
//
// 10/24/2024 - Restructuring code.
// =============================================================================

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const querystring = require("querystring");

// =============================================================================
// Frankus Constants
// =============================================================================

const FRANKUS_NO_VALUE_FOUND = -1;

// =============================================================================
// Frankus File
// =============================================================================

/**
 * The Frankus File wrapper allows full reading of a file from start to finish
 * and vice versa. You can read lines in random order and process the file in
 * read or write mode. This core object gets the Frankus seal of approval!
 */
class frankusFile {

  static startup = process.cwd();
  static saved_startup = process.cwd();
  static script_root = __dirname;

  /**
   * Creates a file module.
   * @param name The name of the file.
   * @param absolute If true then the file path is local to the script. Optional.
   */
  constructor(name, absolute) {
    this.file = name;
    this.absolute = absolute;
    this.lines = [];
    this.data = "";
    this.message = "";
    this.error = "";
    this.pointer = 0;
    this.buffer = null;
  }

  /**
   * Reads the contents of the file.
   */
  Read() {
    try {
      this.data = fs.readFileSync(frankusFile.Get_Local_Path(this.file, this.absolute), "utf8");
      this.lines = Frankus_Split(this.data);
    }
    catch (error) {
      this.error = error.message;
    }
  }

  /**
   * Reads binary data. Only the buffer is populated.
   */
  Read_Binary() {
    try {
      this.buffer = fs.readFileSync(frankusFile.Get_Local_Path(this.file, this.absolute));
    }
    catch (error) {
      this.error = error.message;
    }
  }

  /**
   * Streams the file to a write stream to prevent memory exhaustion.
   * @param write_stream The write stream to push the data to.
   */
  Read_Stream(write_stream) {
    let file_stream = fs.createReadStream(frankusFile.Get_Local_Path(this.file, this.absolute));
    file_stream.pipe(write_stream);
  }

  /**
   * Writes the contents of a file.
   */
  Write() {
    this.data = this.lines.join("\n");
    this.Write_From_Data();
  }

  /**
   * Writes the file from the data.
   */
  Write_From_Data() {
    try {
      fs.writeFileSync(frankusFile.Get_Local_Path(this.file, this.absolute), this.data);
    }
    catch (error) {
      this.error = error.message;
    }
  }

  /**
   * Writes binary data.
   */
  Write_Binary() {
    this.buffer = Buffer.from(this.data, "base64");
    this.Write_From_Buffer();
  }

  /**
   * Writes the data from the buffer.
   */
  Write_From_Buffer() {
    try {
      fs.writeFileSync(frankusFile.Get_Local_Path(this.file, this.absolute), this.buffer);
    }
    catch (error) {
      this.error = error.message;
    }
  }

  /**
   * Adds a line to the file.
   * @param line The line to add.
   */
  Add(line) {
    this.lines.push(line);
  }

  /**
   * Adds a bunch of lines to the file.
   * @param lines The list of lines to add.
   */
  Add_Lines(lines) {
    this.lines = this.lines.concat(lines);
  }

  /**
   * Adds an object to the file.
   * @param object The object to add to the file.
   */
  Add_Object(object) {
    this.Add("object");
    for (let field in object) {
      let value = object[field];
      this.Add(field + "=" + value);
    }
    this.Add("end");
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
    Frankus_Check_Condition((line == "object"), "Object identifier missing.");
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
   * Sorts the lines according to the order.
   * @param ascending If true then the lines are sorted ascending.
   * @param numeric If true then the lines are sorted as numbers.
   */
  Sort_Lines(ascending, numeric) {
    this.lines.sort(function(a, b) {
      let diff = 0;
      if (numeric) {
        let n1 = parseInt(a);
        let n2 = parseInt(b);
        diff = (ascending) ? n1 - n2 : n2 - n1;
      }
      else {
        diff = (ascending) ? a - b : b - a;
      }
      return diff;
    });
  }

  /**
   * Modifies lines of data.
   * @param on_mod Called when lines needs modding. Passed in line, return modded line.
   */
  Mod_Data(on_mod) {
    let line_count = this.lines.length;
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = this.lines[line_index];
      this.lines[line_index] = on_mod(line);
    }
  }

  /**
   * Rewinds the file pointer.
   */
  Rewind() {
    this.pointer = 0;
  }

  /**
   * Gets the extension of the given file.
   * @param file The file path.
   * @return The file extension without the dot.
   */
  static Get_Extension(file) {
    return (file.match(/\w+\.\w+$/)) ? frankusFile.Escape_Path(file).split(path.sep).pop().replace(/^\w+\./, "") : "";
  }

  /**
   * Gets the name of a file.
   * @param file The file to get the name of.
   * @return The name of the file.
   */
  static Get_File_Name(file) {
    return frankusFile.Escape_Path(file).split(path.sep).pop();
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
   * Gets the local path given the folder.
   * @param folder The folder path.
   * @param absolute Determines if the script path is used. Optional.
   * @return The platform depend OS path.
   */
  static Get_Local_Path(folder, absolute) {
    let folders = frankusFile.startup.split(path.sep).concat(frankusFile.Escape_Path(folder).split(path.sep));
    if (absolute) {
      folders = frankusFile.script_root.split(path.sep).concat(frankusFile.Escape_Path(folder).split(path.sep));
    }
    let new_folders = [];
    let folder_count = folders.length;
    for (let folder_index = 0; folder_index < folder_count; folder_index++) {
      if (folders[folder_index] == "up") {
        // Remove previous folder.
        new_folders.pop();
      }
      else if (folders[folder_index] == "root") {
        // Clear all folders until path is same as saved startup.
        let dir = new_folders.join(path.sep);
        let saved_startup = (absolute) ? frankusFile.script_root : frankusFile.saved_startup;
        while (dir != saved_startup) {
          if (new_folders.length > 0) {
            new_folders.pop();
            dir = new_folders.join(path.sep);
          }
          else {
            break;
          }
        }
      }
      else if (folders[folder_index] == "clear") {
        while (new_folders.length > 0) { // Clear out entire contents of new_folders.
          new_folders.pop();
        }
      }
      else {
        new_folders.push(folders[folder_index]);
      }
    }
    return new_folders.join(path.sep);
  }

  /**
   * Escapes a folder path to platform independent path separators.
   * @param folder The folder path.
   * @return The path that is platform independent.
   */
  static Escape_Path(folder) {
    return folder.replace(/(\/|\\)/g, path.sep);
  }

  /**
   * Creates a new folder.
   * @param folder The folder to create.
   * @param absolute If set then the folder is created relative to the script.
   */
  static Create_Folder(folder, absolute) {
    try {
      let dest = frankusFile.Get_Local_Path(folder, absolute);
      fs.mkdirSync(dest, {
        recursive: true
      });
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Queries a group of files in a directory or a group of folders.
   * @param folder The folder to look for files.
   * @param search The search string. Used Frankus wildcards.
   * @param absolute If set looks for files relative to the script.
   * @return The list of files in the folder.
   */
  static Query_Files(folder, search, absolute) {
    let file_list = [];
    try {
      folder = frankusFile.Escape_Path(folder);
      // Remove trailing slash.
      folder = (folder[folder.length - 1] == path.sep) ? folder.substr(0, folder.length - 1) : folder;
      let dest = frankusFile.Get_Local_Path(folder, absolute);
      let files = fs.readdirSync(dest);
      // Process files to determine if they are directories.
      let file_count = files.length;
      for (let file_index = 0; file_index < file_count; file_index++) {
        let file = files[file_index];
        let dir = path.join(dest, file);
        let stats = fs.lstatSync(dir);
        if (!stats.isDirectory()) {
          if (search == "all") { // All keys.
            file_list.push(file);
          }
          else if (search.match(/,/)) { // List of extensions.
            let list = search.replace(/,/g, "|");
            if (file.match(new RegExp("\\.(" + list + ")$"), "")) {
              file_list.push(file);
            }
          }
          else if (search.match(/^\*\w+$/)) { // File extension.
            let query = search.replace(/^\*/, "");
            if (file.match(new RegExp("\\w+\\." + query + "$"), "")) {
              file_list.push(file);
            }
          }
          else if (search.match(/^\*\w+\.\w+$/)) { // File pattern.
            let query = search.replace(/^\*/, "");
            if (file.match(new RegExp(query + "$"), "")) {
              file_list.push(file);
            }
          }
          else if (search.match(/^@\w+$/)) { // Random pattern.
            let query = search.replace(/^@/, "");
            if (file.indexOf(query) != FRANKUS_NO_VALUE_FOUND) {
              file_list.push(file);
            }
          }
        }
        else { // Directory read.
          if (search == "folders") {
            if ((file.indexOf(".") == FRANKUS_NO_VALUE_FOUND) && (file.indexOf("..") == FRANKUS_NO_VALUE_FOUND)) {
              file_list.push(file);
            }
          }
        }
      }
    }
    catch (error) {
      console.log(error.message);
    }
    return file_list;
  }

  /**
   * Grabs the list of files from the folder including the subfolders.
   * @param folder The folder to look in.
   * @param exclude An optional parameter to exclude a list of folders.
   * @param absolute If set get the file and folder list relative to the script.
   * @return The list of files and folders.
   */
  static Get_File_And_Folder_List(folder, exclude, absolute) {
    let file_list = [];
    try {
      let files = fs.readdirSync(frankusFile.Get_Local_Path(folder, absolute));
      let file_count = files.length;
      for (let file_index = 0; file_index < file_count; file_index++) {
        let file = path.join(frankusFile.Escape_Path(folder), files[file_index]);
        let stats = fs.statSync(frankusFile.Get_Local_Path(file, absolute));
        if (stats.isDirectory()) {
          let skip_folder = false;
          if (exclude != undefined) {
            let exclude_count = exclude.length;
            for (let exclude_index = 0; exclude_index < exclude_count; exclude_index++) {
              if (frankusFile.Escape_Path(exclude[exclude_index]).indexOf(file) != FRANKUS_NO_VALUE_FOUND) { // Check for pattern match.
                skip_folder = true;
                break;
              }
            }
          }
          if (!skip_folder) {
            file_list.push(file);
            var sub_file_list = frankusFile.Get_File_And_Folder_List(file, exclude);
            file_list = file_list.concat(sub_file_list);
          }
        }
        else {
          file_list.push(file);
        }
      }
    }
    catch (error) {
      console.log(error.message);
    }
    return file_list;
  }

  /**
   * Changes to a specific folder.
   * @param folder The folder to change to.
   */
  static Change_Folder(folder) {
    frankusFile.startup = frankusFile.Get_Local_Path(folder);
  }

  /**
   * Reverts back to the original startup folder.
   */
  static Revert_Folder() {
    frankusFile.startup = frankusFile.saved_startup;
  }

  /**
   * Gets the modification time of a file.
   * @param file The file to get the modification time for.
   * @return The modification time of the file.
   */
  static Get_File_Modified_Time(file) {
    let modification_time = "";
    try {
      let stats = fs.statSync(frankusFile.Get_Local_Path(file));
      modification_time = stats.mtime;
    }
    catch (error) {
      console.log(error.message);
    }
    return modification_time;
  }

  /**
   * Converts a path to a URL path.
   * @param file The file to convert.
   * @return The URL file path.
   */
  static To_URL_Path(file) {
    return frankusFile.Escape_Path(file).replace(path.sep, "/");
  }

  /**
   * Checks to see if a file exists.
   * @param file The file to check.
   * @return True if the file exists, false otherwise.
   */
  static Does_File_Exist(file) {
    let exists = false;
    try {
      exists = fs.existsSync(frankusFile.Get_Local_Path(file));
    }
    catch (error) {
      console.log(error.message);
    }
    return exists;
  }

  /**
   * Copies a file from source to dest.
   * @param source The source file to copy.
   * @param dest The destination file.
   * @param absolute If set then the source path is relative to the script.
   */
  static Copy_File(source, dest, absolute) {
    try {
      fs.copyFileSync(frankusFile.Get_Local_Path(source, absolute), frankusFile.Get_Local_Path(dest));
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Gets the size of a file.
   * @param file The file to get the size for.
   * @return The file size in bytes.
   */
  static Get_File_Size(file) {
    let file_size = 0;
    try {
      let stats = fs.statSync(frankusFile.Get_Local_Path(file));
      file_size = stats.size;
    }
    catch (error) {
      console.log(error.message);
    }
    return file_size;
  }

  /**
   * Deletes a file.
   * @param file The name of the file to delete.
   */
  static Delete_File(file) {
    try {
      fs.unlinkSync(frankusFile.Get_Local_Path(file));
    }
    catch (error) {
      console.log(error.message);
    }
  }

  /**
   * Determines if a file name is a file.
   * @param file The file to test.
   * @return True if it is a file name, false otherwise.
   */
  static Is_File_Name(file) {
    return file.match(/\w+\.\w+$/);
  }

  /**
   * Determines if a file is a folder.
   * @param file The name of the file.
   */
  static Is_Folder(file) {
    return !file.match(/\w+\.\w+$/);
  }

  /**
   * Renames a file.
   * @param old_name The old name of the file.
   * @param new_name The new name of the file.
   */
  static Rename_File(old_name, new_name) {
    try {
      fs.renameSync(frankusFile.Get_Local_Path(old_name), frankusFile.Get_Local_Path(new_name));
    }
    catch (error) {
      console.log(error.message);
    }
  }

}

// =============================================================================
// Frankus Configuration Reader
// =============================================================================

/**
 * The Frankus Config module gives you full access to any Frankus config file.
 * Without have to do extensive process you can Frankus your way into configuration
 * like no other!
 */
class frankusConfig {

  /**
   * Creates a new config module.
   * @param name The name of the config file.
   * @param bank The name of the code bank where the config is stored.
   * @throws An error if the config could not be read.
   */
  constructor(name, bank) {
    this.config = {};
    this.name = name;
    this.properties = [];
    let code_bank = new frankusCode_Bank(bank);
    let file = code_bank.Get("Config/" + name + ".txt");
    while (file.Has_More_Lines()) {
      let line = file.Get_Line();
      let pair = line.split("=");
      if (pair.length == 2) {
        let name = pair[0];
        let value = pair[1];
        if (!isNaN(pair[1])) {
          value = parseInt(pair[1]);
        }
        this.config[name] = value;
        this.properties.push(name);
      }
    }
  }

  /**
   * Gets a numeric property value.
   * @param name The name of the property.
   * @return The value of the property.
   * @throws An error if the property does not exist.
   */
  Get_Property(name) {
    Frankus_Check_Condition((this.config[name] != undefined), "Property value " + name + " does not exist.");
    return this.config[name];
  }

  /**
   * Determines if a property exists.
   * @param name The name of the property.
   * @return True if the property exists, false otherwise.
   */
  Has_Property(name) {
    return (this.config[name] != undefined);
  }

  /**
   * Sets the property of the config file.
   * @param name The name of the property to set.
   * @param value The value of the property to set.
   */
  Set_Property(name, value) {
    this.config[name] = value;
    this.properties.push(name);
  }

  /**
   * Saves the config file.
   */
  Save() {
    let file = new frankusFile("Config/" + this.name + ".txt", true);
    for (let property in this.config) {
      let value = this.config[property];
      file.Add(property + "=" + value);
    }
    file.Write();
  }

}

// =============================================================================
// Frankus MIME Reader
// =============================================================================

/**
 * The Frankus MIME reader makes short work of reading the MIME file which
 * ensures that proper MIME types are processed accordingly.
 */
class frankusMime_Reader extends frankusConfig {

  /**
   * Creates an MIME reader.
   * @param name The name of the MIME file.
   * @param bank The name of the bank containing the MIME file.
   * @throws An error if the MIME file is not formatted correctly.
   */
  constructor(name, bank) {
    super(name, bank);
    this.mime = {};
    let prop_count = this.properties.length;
    for (let prop_index = 0; prop_index < prop_count; prop_index++) {
      let property = this.properties[prop_index];
      let data = this.Get_Property(property);
      let pair = data.split(",");
      Frankus_Check_Condition((pair.length == 2), "Mime data not formatted correctly.");
      this.mime[property] = {
        type: pair[0],
        binary: (pair[1] == "true") ? true : false
      };
    }
  }

  /**
   * Gets the MIME type associated with the given extension.
   * @param ext The extension associated with the MIME type.
   * @throws An error if the MIME type is invalid.
   */
  Get_Mime_Type(ext) {
    Frankus_Check_Condition((this.mime[ext] != undefined), "MIME type " + ext + " is not defined.");
    return this.mime[ext];
  }

  /**
   * Determines if an MIME type exists.
   * @param ext The extension to check.
   * @return True if the MIME type exists, false otherwise.
   */
  Has_Mime_Type(ext) {
    return (this.mime[ext] != undefined);
  }

}

// =============================================================================
// Frankus Code Bank
// =============================================================================

/**
 * The Frankus Code Bank is a module to store project data into one file. It can
 * store code but also stores references to binary files. Could be used as a
 * database.
 */
class frankusCode_Bank {

  /**
   * Creates a new code bank.
   * @param name The name of the file to load for the code bank.
   */
  constructor(name) {
    this.name = name;
    this.bank = {};
    this.Load(name);
  }

  /**
   * Loads a code bank by name.
   * @param name The name of the code bank file.
   * @throws An error if the bank is not correctly formatted.
   */
  Load(name) {
    let cb_file = new frankusFile("Code_Banks/" + name + ".txt", true);
    cb_file.Read();
    while (cb_file.Has_More_Lines()) {
      let file_meta = {
        "lines": []
      };
      cb_file.Get_Object(file_meta);
      Frankus_Check_Condition((file_meta["name"] != undefined), "Missing file name.");
      Frankus_Check_Condition((file_meta["type"] != undefined), "Missing file type.");
      file_meta["name"] = this.Convert_To_Bank_Path(file_meta["name"]); // Make sure we have bank path.
      if (file_meta["type"] == "code") {
        Frankus_Check_Condition((file_meta["count"] != undefined), "Missing number of lines.");
        let line_count = file_meta["count"];
        for (let line_index = 0; line_index < line_count; line_index++) {
          let line = cb_file.Get_Line();
          file_meta["lines"].push(line);
        }
        this.bank[file_meta["name"]] = file_meta;
      }
      else if (file_meta["type"] == "link") {
        this.bank[file_meta["name"]] = file_meta; // Just link info.
      }
      else {
        throw new Error("Unknown file type " + file_meta["type"] + ".");
      }
    }
  }

  /**
   * Saves the code bank to a named file.
   * @throws An error if something went wrong.
   */
  Save() {
    let cb_file = new frankusFile("Code_Banks/" + this.name + ".txt", true);
    for (let file in this.bank) {
      let file_meta = this.bank[file];
      let meta_data = {
        "name": file,
        "type": file_meta["type"]
      };
      if (file_meta["type"] == "code") {
        meta_data["count"] = file_meta["count"];
        cb_file.Add_Object(meta_data);
        let lines = file_meta["lines"].slice(0);
        cb_file.Add_Lines(lines);
      }
      else if (file_meta["type"] == "link") {
        cb_file.Add_Object(meta_data);
      }
    }
    cb_file.Write();
  }

  /**
   * Gets the contents of a file from the code bank.
   * @param name The name of the file.
   * @return A file object with the data or without it.
   * @throws An error if the file does not exist.
   */
  Get(name) {
    name = this.Convert_To_Bank_Path(name);
    Frankus_Check_Condition((this.bank[name] != undefined), name + " does not exist.");
    let file_meta = this.bank[name];
    let file = new frankusFile(name);
    if (file_meta["type"] == "code") {
      file.Add_Lines(file_meta["lines"]);
      file.data = file.lines.join("\n"); // Update file data.
    }
    return file;
  }

  /**
   * Puts a file in the code bank.
   * @param name The name of the file to put.
   * @param type The type of file. ("code" or "link")
   * @param data The file data.
   * @throws An error if the type is not correct.
   */
  Put(name, type, data) {
    name = this.Convert_To_Bank_Path(name);
    Frankus_Check_Condition(((type == "code") || (type == "link")), "Not code or link.");
    this.bank[name] = {
      "name": name,
      "type": type,
    };
    if (type == "code") {
      let lines = Frankus_Split(data);
      this.bank[name]["count"] = lines.length;
      this.bank[name]["lines"] = lines;
    }
  }

  /**
   * Deletes a file in the bank.
   * @param name The name of the file.
   * @throws An error if the file was not found.
   */
  Delete(name) {
    name = this.Convert_To_Bank_Path(name);
    Frankus_Check_Condition((this.bank[name] != undefined), name + " was not found.");
    delete this.bank[name];
  }

  /**
   * Browses a cabinet via a folder.
   * @param folder The folder path.
   * @return A list of file names.
   */
  Browse_By_Folder(folder) {
    let files = [];
    folder = this.Convert_To_Bank_Path(folder);
    for (let file in this.bank) {
      if (file.indexOf(folder) == 0) {
        files.push(file);
      }
    }
    return files;
  }

  /**
   * Converts a folder path to a bank path.
   * @param folder The folder path.
   * @return The bank path.
   */
  Convert_To_Bank_Path(folder) {
    return folder.replace(/:|\/|\\/g, "->");
  }

  /**
   * Queries a group of files in a directory or a group of folders.
   * @param folder The folder to look for files.
   * @param search The search string. Used Frankus wildcards.
   * @return The list of files in the folder.
   */
  Query_Files(folder, search) {
    let file_list = [];
    let dest = this.Convert_To_Bank_Path(folder);
    let files = this.Browse_By_Folder(dest);
    // Process files to determine if they are directories.
    let file_count = files.length;
    for (let file_index = 0; file_index < file_count; file_index++) {
      let file = files[file_index];
      if (search == "all") { // All keys.
        file_list.push(file);
      }
      else if (search.match(/,/)) { // List of extensions.
        let list = search.replace(/,/g, "|");
        if (file.match(new RegExp("\\.(" + list + ")$"), "")) {
          file_list.push(file);
        }
      }
      else if (search.match(/^\*\w+$/)) { // File extension.
        let query = search.replace(/^\*/, "");
        if (file.match(new RegExp("\\w+\\." + query + "$"), "")) {
          file_list.push(file);
        }
      }
      else if (search.match(/^\*\w+\.\w+$/)) { // File pattern.
        let query = search.replace(/^\*/, "");
        if (file.match(new RegExp(query + "$"), "")) {
          file_list.push(file);
        }
      }
      else if (search.match(/^@\w+$/)) { // Random pattern.
        let query = search.replace(/^@/, "");
        if (file.indexOf(query) != FRANKUS_NO_VALUE_FOUND) {
          file_list.push(file);
        }
      }
    }
    return file_list;
  }

  /**
   * Clears the bank.
   */
  Clear() {
    this.bank = {};
  }

  /**
   * Creates a code bank from a directory path.
   * @param dir The root directory.
   * @param bank The code bank associated with the MIME data.
   * @throws An error if something went wrong.
   */
  Create_From_Directory_Path(dir, bank) {
    let mime = new frankusMime_Reader("Mime", bank);
    let file_list = frankusFile.Get_File_And_Folder_List(dir, []);
    let file_count = file_list.length;
    for (let file_index = 0; file_index < file_count; file_index++) {
      let file = file_list[file_index];
      if (frankusFile.Is_File_Name(file)) {
        let ext = frankusFile.Get_Extension(file);
        if (mime.Has_Mime_Type(ext)) {
          let mime_entry = mime.Get_Mime_Type(ext);
          if (mime_entry.binary) {
            this.Put(file, "link", "");
            console.log("Added link " + file + ".");
          }
          else {
            let new_file = new frankusFile(file);
            new_file.Read();
            if (new_file.error.length == 0) {
              this.Put(file, "code", new_file.data);
              console.log("Added code " + file + ".");
            }
          }
        }
      }
    }
    this.Save();
  }

  /**
   * Adds a single file to the code bank.
   * @param name The name of the file to add.
   */
  Add_File(name) {
    let file = new frankusFile(name);
    file.Read();
    if (file.error.length == 0) {
      this.Put(name, "code", file.data);
      this.Save();
      console.log("Added file " + name + ".");
    }
  }

}

// =============================================================================
// Frankus Coder Doc
// =============================================================================

/**
 * Frankus Coder Doc is a tool to generate documentation for you code. It is
 * similar to Java Doc. This is useful in quickly looking over the entire API of
 * a project. Kind of like a site map for code!
 */
class frankusCoder_Doc {

  /**
   * Creates a new documentation generator.
   * @param project The associated project.
   * @param bank The code bank where the data is stored.
   */
  constructor(project, bank) {
    this.project = project;
    this.docs_folder = "";
    this.code_bank = new frankusCode_Bank(bank);
    this.copy_file_list = [
      "Coder_Doc.css",
      "Regular.ttf",
      "Regular_Bold.ttf",
      "Regular_Italic.ttf"
    ];
    this.copy_file_locs = [
      "*Coder_Doc/",
      "Fonts/",
      "Fonts/",
      "Fonts/"
    ];
  }

  /**
   * Processes a source code file and generates HTML code.
   * @param file The file to process the source.
   */
  Process_Source_File(file) {
    let title = frankusFile.Get_File_Title(file);
    let ext = frankusFile.Get_Extension(file);
    let file_reader = new frankusFile(file);
    file_reader.Read();
    let lines = file_reader.lines;
    let line_count = lines.length;
    let body = [];
    let function_list = [];
    let class_list = [];
    let comment = [];
    let function_hash = {};
    let class_hash = {};
    let last_class = "";
    for (let line_index = 0; line_index < line_count; line_index++) {
      let line = lines[line_index];
      if (line.match(/^\s*\/\*{2}/)) { // Beginning of JavaDoc comment.
        comment.push("\n");
      }
      else if (line.match(/^\s*\*\s+/)) { // Middle of JavaDoc comment.
        let trimmed_line = line.replace(/^\s*\*\s/, "") + "\n";
        comment.push(trimmed_line);
      }
      else if (line.match(/^\s*\*\//)) { // End of JavaDoc comment.
        comment.push("\n");
      }
      else if (line.match(/^\s*\*$/)) { // Empty line in comment.
        comment.push("\n");
      }
      else if (line.match(/^\s*function\s+\w+/)) { // JavaScript function.
        let function_def = line.replace(/^\s*function\s+/, "")
                              .replace(/\s*\{\s*$/, "");
        let function_name = function_def.replace(/\([^\)]*\)/, "");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*class\s+\w+/) && (ext == "js")) { // Class declaration.
        let class_name = line.replace(/^\s*class\s+(\w+).*$/, "$1");
        last_class = class_name;
        comment.unshift("@" + class_name + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(class_name) + " ");
        class_list.push('<a href="#' + Frankus_String_To_Hex(class_name) + '">' + class_name + '</a><br />');
        console.log("Added class " + class_name + ".");
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*(\w+|static\s+\w+)\(/) && line.match(/\)\s*\{$/) && !line.match(/function/) && (ext == "js")) { // Class member function.
        let class_function_def = line.replace(/^\s*/, "")
                                     .replace(/static\s+/, "")
                                     .replace(/\s*\{\s*$/, "");
        let class_function_name = class_function_def.replace(/\([^\)]*\)/, "");
        comment.unshift("$" + class_function_def + "$ ");
        // Make sure member functions do not match eachother or global functions.
        comment.unshift("anchor://" + Frankus_String_To_Hex(last_class + class_function_name) + " ");
        class_list.push('<a href="#' + Frankus_String_To_Hex(last_class + class_function_name) + '">&nbsp;&nbsp;&rdsh;' + class_function_name + '</a><br />');
        console.log("Added class function " + class_function_name + ".");
        class_hash[last_class + ":" + class_function_name] = Frankus_String_To_Hex(last_class + class_function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\w+:\s+function\([^\)]*\)\s*\{$/) && (ext == "js")) { // Prototype function member.
        let function_def = line.replace(/^\s*(\w+):\s+function\(([^\)]*)\)\s*\{\s*$/, "$1($2)");
        let function_name = line.replace(/^\s*(\w+):\s+function\([^\)]*\)\s*\{\s*$/, "$1");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*var\s+\$\w+/)) { // Global variable.
        let global_def = line.replace(/^\s*var\s+\$(\w+)\s+=\s+\S+;?.*$/, "$1");
        comment.unshift("$" + global_def + "$\n");
        console.log("Added global variable " + global_def + ".");
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\S+\s+\w+\([^\)]*\)(\s+\{|)\s*$/) && ext.match(/cpp|hpp/)) { // C++ routine.
        let function_def = line.replace(/^\s*(\S+\s+\w+\([^\)]*\))(\s+\{|)\s*$/, "$1");
        let function_name = line.replace(/^\s*\S+\s+(\w+)\([^\)]*\)(\s+\{|)\s*$/, "$1");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*template\s+<[^>]*>\s+\S+\s+\w+<[^>]*>::\w+\([^\)]*\)(\s+\{|)\s*$/)) { // Template class function.
        let function_def = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+<[^>]*>::\w+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+)<[^>]*>::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*template\s+<[^>]*>\s+\w+<[^>]*>::\w+\([^\)]*\)(\s+\{|)\s*$/)) { // Template class constructor.
        let function_def = line.replace(/^\s*template\s+<[^>]*>\s+(\w+<[^>]*>::\w+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*template\s+<[^>]*>\s+(\w+)<[^>]*>::(\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*template\s+<[^>]*>\s+\w+<[^>]*>::~\w+\([^\)]*\)(\s+\{|)\s*$/)) { // Template class destructor.
        let function_def = line.replace(/^\s*template\s+<[^>]*>\s+(\w+<[^>]*>::~\w+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*template\s+<[^>]*>\s+(\w+)<[^>]*>::(~\w+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*template\s+<[^>]*>\s+\S+\s+\w+<[^>]*>::operator\S+\s+\([^\)]*\)(\s+\{|)\s*$/)) { // Template class operator.
        let function_def = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+<[^>]*>::operator\S+\s+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*template\s+<[^>]*>\s+\S+\s+(\w+)<[^>]*>::operator(\S+)\s+\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\S+\s+[^:]+::[^\(]+\([^\)]*\)(\s+\{|)\s*$/) && ext.match(/cpp|hpp/)) { // C++ class method.
        let function_def = line.replace(/^\s*(\S+\s+[^:]+::[^\(]+\([^\)]*\))(\s+\{|)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*\S+\s+([^:]+)::([^\(]+)\([^\)]*\)(\s+\{|)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\w+::\w+\([^\)]*\)(\s+\{|\s+:\s*|\s+:\s+\w+\([^\)]*\)\s+\{)\s*$/) && ext.match(/cpp|hpp/)) { // C++ constructor.
        let function_def = line.replace(/^\s*\w+::(\w+\([^\)]*\))(\s+\{|\s+:\s*|\s+:\s+\w+\([^\)]*\)\s+\{)\s*$/, "$1").replace(/\*/g, "**");
        let function_name = line.replace(/^\s*(\w+)::(\w+)\([^\)]*\)(\s+\{|\s+:\s*|\s+:\s+\w+\([^\)]*\)\s+\{)\s*$/, "[$1]:$2");
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
      else if (line.match(/^\s*\w+::~\w+\([^\)]*\)\s+\{\s*$/) && ext.match(/cpp|hpp/)) { // C++ destructor.
        let function_def = line.replace(/^\s*(\w+)::(~\w+)\([^\)]*\)\s+\{\s*$/, "[$1]:$2");
        let function_name = function_def;
        comment.unshift("@" + function_def + "@");
        comment.unshift("anchor://" + Frankus_String_To_Hex(function_name) + " ");
        function_list.push('<a href="#' + Frankus_String_To_Hex(function_name) + '">' + function_name + '</a><br />');
        console.log("Added function " + function_name + ".");
        // Store function code.
        function_hash[function_name] = Frankus_String_To_Hex(function_name);
        // Add the comment to the body.
        body = body.concat(comment);
        comment = [];
      }
    }
    // Replace all hashes with codes.
    let formatted_body = Frankus_Compile_Markdown(body.join(""));
    let hash_keys = formatted_body.match(/hash=\w+:?\w*/g);
    if (hash_keys) {
      let hash_key_count = hash_keys.length;
      for (let hash_index = 0; hash_index < hash_key_count; hash_index++) {
        let hash_key = hash_keys[hash_index].replace(/^hash=/, "");
        let code = "#";
        if (hash_key.match(/:/)) {
          code += class_hash[hash_key];
        }
        else { // Function hash.
          code += function_hash[hash_key];
        }
        if (code) {
          formatted_body = formatted_body.replace(/hash=\w+:?\w*/, code);
        }
      }
    }
    // Process the template here.
    this.Process_Template("Module_Template.html", title + "_" + ext + ".html", {
      title: title,
      api_list: function_list.join("\n") + class_list.join("\n"),
      api_body: formatted_body
    });
  }

  /**
   * Processes a wiki file.
   * @param file The file to process.
   */
  Process_Wiki_File(file) {
    let doc = frankusFile.Get_File_Title(file);
    let file_reader = new frankusFile(file);
    file_reader.Read();
    let wiki = Frankus_Compile_Markdown(file_reader.data);
    this.Process_Template("Wiki_Template.html", doc + ".html", {
      document: doc,
      wiki_body: wiki
    });
    console.log("Processed file " + file + " into " + doc + ".");
  }

  /**
   * Processes a template into an HTML file.
   * @param template_name The name of the template file to be processed.
   * @param output_name The name of the output file.
   * @param config The config hash with the template variables.
   * @throws An error if the template could not be read.
   */
  Process_Template(template_name, output_name, config) {
    let file_reader = this.code_bank.Get("Coder_Doc/" + template_name);
    let template = file_reader.data;
    // Replace all template variables.
    for (let variable in config) {
      let value = config[variable];
      template = template.replace(new RegExp("%" + variable + "%", "g"), value);
    }
    // Write out template to file.
    let file_writer = new frankusFile(this.docs_folder + "/" + output_name);
    file_writer.data = template;
    file_writer.Write_From_Data();
  }

  /**
   * Processes the code into docs.
   * @throws An error if a file could not be read.
   */
  Process_Code() {
    // Set project and documents folder.
    frankusFile.Change_Folder(this.project);
    this.docs_folder = "Docs";
    // Check for document folder.
    frankusFile.Create_Folder(this.docs_folder);
    console.log("Created " + this.docs_folder + " folder.");
    // Copy files into documents folder.
    let def_file_count = this.copy_file_list.length;
    for (let file_index = 0; file_index < def_file_count; file_index++) {
      let file = this.copy_file_list[file_index];
      let loc = this.copy_file_locs[file_index];
      let source = "root/" + loc + file;
      let dest = this.docs_folder + "/" + file;
      if (loc.match(/^\*\w+\/$/)) { // From the code bank.
        let source_file = this.code_bank.Get(loc.replace(/^\*/, "") + file); // Destar.
        console.log(source_file.file);
        source_file.file = dest; // Change destination for file.
        source_file.Write();
      }
      else {
        frankusFile.Copy_File(source, dest, true);
      }
      console.log("Copied file " + file + ".");
    }
    // Now process the files.
    let files = frankusFile.Get_File_And_Folder_List("", [ "Video_Games", "Electron" ]);
    let file_count = files.length;
    let file_list = [];
    for (let file_index = 0; file_index < file_count; file_index++) {
      let file = files[file_index];
      let file_title = frankusFile.Get_File_Title(file);
      let ext = frankusFile.Get_Extension(file);
      if (ext.match(/js|cpp|hpp/)) { // Look for code files.
        this.Process_Source_File(file);
        file_list.push('<a href="' + file_title + '_' + ext + '.html">' + file + '</a>');
        console.log("File " + file + " added to index.");
      }
      else if (file == "Readme.txt") { // Process Readme file too.
        this.Process_Wiki_File(file);
        file_list.push('<a href="' + file_title + '.html">' + file + '</a>');
      }
    }
    // Process the Files index first.
    this.Process_Template("Files_Template.html", "Files.html", {
      file_list: file_list.join("<br />")
    });
    frankusFile.Revert_Folder();
  }

}

// =============================================================================
// Frankus Project Routines
// =============================================================================

/**
 * Updates a project with a boilerplate so you don't have to manually copy the files.
 * This is useful to distributing source code projects.
 * @param name The name of the boilerplate.
 * @param project The name of the project.
 * @param bank The code bank where the project is stored.
 * @throws An error if the project wasn't found.
 */
function Frankus_Update_Project_With_Boilerplate(name, project, bank) {
  let code_bank = new frankusCode_Bank(bank);
  let boilerplate_file = code_bank.Get("Boilerplates/" + name + ".txt");
  // Create project folder.
  frankusFile.Create_Folder("Projects/" + project, true);
  while (boilerplate_file.Has_More_Lines()) {
    let line = boilerplate_file.Get_Line();
    if (line.match(/^\w+\->\S+$/)) { // Folders.
      let pair = line.split("->");
      if (pair.length == 2) {
        let folder = pair[0];
        let data = pair[1];
        if (data == "all") {
          frankusFile.Create_Folder("Projects/" + project + "/" + folder, true);
          let file_list = frankusFile.Get_File_And_Folder_List(folder, [], true);
          let file_count = file_list.length;
          for (let file_index = 0; file_index < file_count; file_index++) {
            let file = file_list[file_index];
            if (frankusFile.Is_File_Name(file)) {
              let dest = frankusFile.Get_File_Name(file);
              frankusFile.Copy_File(file, "Projects/" + project + "/" + folder + "/" + dest, true);
              console.log("Copied " + file + " to " + project + "/" + folder + ".");
            }
          }
        }
        else if (data == "empty") {
          frankusFile.Create_Folder("Projects/" + project + "/" + folder, true);
        }
        else { // List of files.
          frankusFile.Create_Folder("Projects/" + project + "/" + folder, true);
          let file_list = data.split(/,/);
          let file_count = file_list.length;
          for (let file_index = 0; file_index < file_count; file_index++) {
            let file = file_list[file_index];
            if (frankusFile.Is_File_Name(file)) {
              frankusFile.Copy_File(folder + "/" + file, "Projects/" + project + "/" + folder + "/" + file, true);
              console.log("Copied " + file + " to " + project + "/" + folder + ".");
            }
          }
        }
      }
    }
    else { // Individual files.
      let file = line;
      frankusFile.Copy_File(file, "Projects/" + project + "/" + file, true);
      console.log("Copied " + file + " to " + project + ".");
    }
  }
}

// =============================================================================
// Frankus Compiler Routines
// =============================================================================

/**
 * Processes a makefile.
 * @param name The name of the makefile.
 * @param project The project to compile.
 * @param bank The code bank where the boilerplate is stored.
 * @param on_compile Called when compilation is finished.
 * @throws An error if something is not configured correctly.
 */
function Frankus_Process_Makefile(name, project, bank, on_compile) {
  let code_bank = new frankusCode_Bank(bank);
  let makefile = code_bank.Get("Makefiles/" + name + ".txt");
  let compiler_info = {};
  makefile.Get_Object(compiler_info);
  Frankus_Check_Condition((compiler_info["compiler"] != undefined), "Missing compiler command.");
  Frankus_Check_Condition((compiler_info["output"] != undefined), "Output option is missing.");
  Frankus_Check_Condition((compiler_info["library"] != undefined), "Library option is missing.");
  Frankus_Check_Condition((compiler_info["include"] != undefined), "Include option is missing.");
  // Read include paths.
  let include_paths = [];
  while (makefile.Has_More_Lines()) {
    let include_path = makefile.Get_Line();
    if (include_path == "end") {
      break;
    }
    else {
      include_paths.push(frankusFile.Get_Local_Path(include_path));
    }
  }
  // Read library paths.
  let library_paths = [];
  while (makefile.Has_More_Lines()) {
    let library_path = makefile.Get_Line();
    if (library_path == "end") {
      break;
    }
    else {
      library_paths.push(library_path);
    }
  }
  // Read libraries.
  let libraries = [];
  while (makefile.Has_More_Lines()) {
    let library = makefile.Get_Line();
    if (library == "end") {
      break;
    }
    else {
      libraries.push(library);
    }
  }
  // Read resource make commands.
  let res_makers = [];
  while (makefile.Has_More_Lines()) {
    let res_maker = makefile.Get_Line();
    if (res_maker == "end") {
      break;
    }
    else {
      res_makers.push(res_maker);
    }
  }
  // Read resources.
  let resources = [];
  while (makefile.Has_More_Lines()) {
    let resource = makefile.Get_Line();
    if (resource == "end") {
      break;
    }
    else {
      resources.push(resource);
    }
  }
  // Do compilation.
  if (frankusFile.Does_File_Exist(project + ".cpp")) {
    let shell = new frankusShell();
    let compile_cmd = [
      compiler_info["compiler"],
      compiler_info["output"],
      project,
      project + ".cpp",
      library_paths.map(function(value, index, array) { return compiler_info["library"] + value }).join(" "),
      include_paths.map(function(value, index, array) { return compiler_info["include"] + value }).join(" "),
      resources.join(" "),
      libraries.join(" ")
    ];
    let batch = res_makers.concat([ compile_cmd.join(" ") ]);
    shell.Execute_Batch(batch, 0, function() {
      console.log("Compilation complete!");
      on_compile();
    });
  }
}

/**
 * Generates a resource file list.
 */
function Frankus_Generate_Resources() {
  let file_list = frankusFile.Get_File_And_Folder_List("");
  // Filter out files to extract images, sounds, and music tracks.
  let file_count = file_list.length;
  let files = [];
  for (let file_index = 0; file_index < file_count; file_index++) {
    let file = frankusFile.Get_File_Name(file_list[file_index]);
    let ext = frankusFile.Get_Extension(file_list[file_index]);
    if (ext.match(/png|bmp|mp3|pic|wav/)) {
      files.push(file);
    }
  }
  let file = new frankusFile("Resources.txt");
  file.Add_Lines(files);
  file.Write();
}

/**
 * Creates an Electron JS app.
 * @param project The project to electronize.
 * @param bank The code bank where the Electron project is stored.
 * @throws An error if Electron is not installed.
 */
function Frankus_Create_Electron_App(project, bank) {
  let code_bank = new frankusCode_Bank(bank);
  let file_list = [
    "Projects/Electron/Electron.js",
    "Projects/Electron/package.json"
  ];
  let file_count = file_list.length;
  for (let file_index = 0; file_index < file_count; file_index++) {
    let source = file_list[file_index];
    let dest = project + "/" + frankusFile.Get_File_Name(source);
    let source_file = code_bank.Get(file);
    source_file.file = dest;
    source_file.Write();
  }
  console.log("Copied Electron into " + project + ".");
}

// =============================================================================
// Server Implementation
// =============================================================================

/**
 * The Frankus Server is a small secure server for managing the Frankus website.
 * It supports HTTPS and stores data in a code bank.
 */
class frankusServer {

  /**
   * Creates a new server.
   * @param name The name of the server.
   * @param bank The programming code bank with the configuration.
   * @throws An error if something went wrong.
   */
  constructor(name, bank) {
    let self = this;
    this.mime = new frankusMime_Reader("Mime", bank);
    this.config = new frankusConfig(name, bank);
    this.db = this.config.Get_Property("db");
    this.code_bank = new frankusCode_Bank(this.db);
    this.passcode = this.config.Get_Property("passcode");
    this.timeout = this.config.Get_Property("timeout");
    this.index = this.config.Get_Property("index");
    this.timer = setInterval(function() {
      self.code_bank.Save();
      console.log("Saved code bank.");
    }, this.timeout * 60 * 1000);
    this.secure = this.config.Get_Property("secure");
    if (this.secure == "on") {
      let certificate = this.config.Get_Property("certificate");
      let prog_bank = new frankusCode_Bank(bank);
      let key_file = prog_bank.Get("Certificates/" + certificate + ".key");
      let cert_file = prog_bank.Get("Certificates/" + certificate + ".crt");
      this.server = https.createServer({
        key: key_file.data,
        cert: cert_file.data
      }, function(request, response) {
        try {
          self.Handle_Request(request, response);
        }
        catch (error) {
          console.log(request.socket.remoteAddress + " -> " + error.message);
          self.End_Response(401, error.message, response);
        }
      });
      this.server.on("drop", function(data) {
        console.log(data.remoteAddress + " dropped.");
      });
      // Don't let connection count get too high.
      this.server.maxConnections = this.config.Get_Property("max-connections");
    }
    else { // Not secure.
      this.server = http.createServer(function(request, response) {
        try {
          self.Handle_Request(request, response);
        }
        catch (error) {
          console.log(request.socket.remoteAddress + " -> " + error.message);
          self.End_Response(401, error.message, response);
        }
      });
    }
    this.server.on("dropRequest", function(request, socket) {
      console.log("Request dropped.");
    });
    this.server.on("clientError", function(error, socket) {
      socket.destroy();
    });
  }

  /**
   * Reads a file from the server.
   * @param file The file to be processed.
   * @param response The response to be populated.
   * @throws An error if the file type is not found in the MIME table.
   */
  Read_File(file, response) {
    let ext = frankusFile.Get_Extension(file);
    let type = this.mime.Get_Mime_Type(ext);
    let input_file = new frankusFile(file);
    if (type.binary) {
      input_file.Read_Binary();
    }
    else {
      input_file.Read();
    }
    if (input_file.error.length == 0) {
      response.writeHead(200, {
        "Content-Type": type.type
      });
      if (type.binary) {
        response.end(input_file.buffer, "binary");
      }
      else {
        response.end(input_file.data);
      }
    }
    else {
      this.End_Response(404, input_file.error, response);
    }
  }

  /**
   * Writes a file to the server.
   * @param file The file to write to the server.
   * @param response The server response object.
   * @param params The parameters passed to the file.
   */
  Write_File(file, response, params) {
    try {
      let ext = frankusFile.Get_Extension(file);
      Frankus_Check_Condition((params.data != undefined), "No data parameter passed.");
      Frankus_Check_Condition((params.passcode == this.passcode), "Invalid passcode for write.");
      let output_file = new frankusFile(file);
      let type = this.mime.Get_Mime_Type(ext);
      if (!type.binary) { // Text file.
        // Save the file.
        output_file.data = params.data;
        output_file.Write_From_Data();
      }
      else { // Binary file.
        // Save the binary code.
        output_file.data = params.data;
        output_file.Write_Binary();
      }
      if (output_file.error.length == 0) {
        this.End_Response(200, "Wrote " + file + ".", response);
      }
      else {
        this.End_Response(404, "Write Error: " + output_file.error, response);
      }
    }
    catch (error) {
      this.End_Response(404, "Write Error: " + error.message, response);
    }
  }

  /**
   * Handles a request from the server.
   * @param request The request object that is passed in.
   * @param response The response object that is passed in.
   * @throws An error if something is wrong.
   */
  Handle_Request(request, response) {
    if (request.method == "GET") {
      let pair = request.url.split("?");
      let file = pair[0].substr(1);
      let params = querystring.parse((pair[1] == undefined) ? "" : pair[1]);
      if (file.match(/^db\//)) { // Code bank access.
        let fname = file.replace(/^db\//, "");
        let fobject = this.code_bank.Get(fname);
        let ext = frankusFile.Get_Extension(fname);
        let type = this.mime.Get_Mime_Type(ext);
        if (type.binary) {
          this.End_Response(401, "Cannot access binary files from code bank.", response);
        }
        else {
          response.writeHead(200, {
            "Content-Type": type.type
          });
          response.end(fobject.lines.join("\n"));
        }
      }
      else if (file == "query-files") {
        Frankus_Check_Condition((params.folder != undefined), "Missing folder parameter.");
        Frankus_Check_Condition((params.search != undefined), "Missing search parameter.");
        let files = this.code_bank.Query_Files(params.folder, params.search).map(function(value, index, array) {
          return value.replace(/\->/g, "/"); // Convert to URL path.
        });
        this.End_Response(200, files.join("\n"), response);
      }
      else if (file.match(/^delete/)) { // Delete file.
        Frankus_Check_Condition((params.passcode == this.passcode), "Invalid passcode for delete.");
        let name = file.replace(/^delete/, "");
        this.code_bank.Delete(name);
        this.End_Response(200, "Deleted " + name + ".", response);
      }
      else if (file == "quit") {
        clearInterval(this.timer);
        this.code_bank.Save();
        console.log("Saved code bank.");
        this.Stop(function() {
          console.log("Server has stopped.");
        });
      }
      else if (file.match(/\w+\.(html|css|js|png|jpg|ico|ttf|wav|mp3)$/)) { // File access.
        this.Read_File(file, response);
      }
      else {
        this.Read_File(this.index, response); // The default index.
      }
    }
    else if (request.method == "POST") {
      let self = this;
      let data = "";
      request.on("data", function(chunk) {
        data += chunk;
      });
      request.on("end", function() {
        try {
          let params = querystring.parse(data);
          let file = request.url.substr(1);
          if (file.match(/^db\//)) { // Code bank access.
            let fname = file.replace(/^db\//, "");
            Frankus_Check_Condition((params.data != undefined), "No data parameter passed.");
            Frankus_Check_Condition((params.passcode == self.passcode), "Invalid passcode for database write.");
            self.code_bank.Put(fname, "code", params.data);
            self.End_Response(200, "Wrote " + fname + " to code bank.", response);
          }
          else if (file.match(/\w+\.(png|jpg|wav|mp3)+$/)) { // File access.
            self.Write_File(file, response, params);
          }
          else {
            self.End_Response(401, "Can only write to code bank.", response);
          }
        }
        catch (error) {
          console.log(request.socket.remoteAddress + " (POST) -> " + error.message);
          self.End_Response(401, error.message, response);
        }
      });
    }
  }

  /**
   * Ends a server response.
   * @param status The status associated with response.
   * @param message The message.
   * @param response The server response.
   */
  End_Response(status, message, response) {
    // Write server output.
    response.writeHead(status, {
      "Content-Type": "text/plain"
    });
    response.end(message);
  }

  /**
   * Starts the server.
   */
  Start() {
    try {
      this.server.listen(this.config.Get_Property("port"));
    }
    catch (error) {
      this.log.Log(error.message);
    }
  }

  /**
   * Stops the server.
   * @param on_stop Called when the server is stopped.
   */
  Stop(on_stop) {
    let self = this;
    this.server.close(function() {
      self.server.unref();
      on_stop();
    });
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
 * Compiles text according to Wiki format.
 * @param text The wiki text to compile into HTML.
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
             .replace(/@param\s+(\w+)\s+([^\r\n]+)/g, '<span class="parameter">$1</span> <em>$2</em>')
             .replace(/@(return)\s+([^\r\n]+)/g, '<span class="return">$1</span> <em>$2</em>')
             .replace(/@(see)\s+([^\r\n]+)/g, '<span class="see">$1</span> <em>$2</em>')
             .replace(/@(throws)\s+([^\r\n]+)/g, '<span class="see">$1</span> <em>$2</em>')
             .replace(/#([^#]+)#/g, "<b>$1</b>")
             .replace(/\*([^*]+)\*/g, "<i>$1</i>")
             .replace(/@([^@]+)@/g, "<h1>$1</h1>")
             .replace(/\$([^$]+)\$/g, "<h2>$1</h2>")
             .replace(/\^([^\^]+)\^/g, '<div class="table_head">$1</div>')
             .replace(/\|([^\|]+)\|/g, '<div class="table_data">$1</div>')
             .replace(/%([^%]+)%/g, '<div class="code"><pre>$1</pre></div>')
             .replace(/`([^`]+)`/g, "<!-- $1 -->")
             .replace(/(http:\/\/\S+|https:\/\/\S+)/g, '<a href="$1" target="_blank">$1</a>')
             .replace(/image:\/\/(\S+)/g, '<img src="Images/$1" alt="Image" />')
             .replace(/progress:\/\/(\d+)/g, '<div class="progress"><div class="percent_complete" style="width: $1%;">$1% Complete</div></div>')
             .replace(/video:\/\/(\S+)/g, '<iframe width="560" height="315" src="https://www.youtube.com/embed/$1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>')
             .replace(/download:\/\/(\S+)/g, '<a href="Upload/$1">$1</a>')
             .replace(/anchor:\/\/(\S+)/g, '<a name="$1"></a>')
             .replace(/\[ruler\]/g, "<hr />")
             .replace(/\[page\-break\]/g, '<div class="page-break"></div>')
             .replace(/\r\n|\r|\n/g, "<br />");
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
 * Converts a number to a binary string.
 * @param number The number.
 * @return The binary string.
 */
function Frankus_Number_To_Binary(number) {
  // 2 | 10 -> 0
  // 2 | 5  -> 1
  // 2 | 2  -> 0
  // 2 | 1  -> 1
  // 2 | 0
  let binary = [];
  while (number > 0) {
    let remainder = number % 2;
    binary.unshift(remainder);
    number = Math.floor(number / 2);
  }
  return binary.join("");
}

/**
 * Prints an object.
 * @param object The object to print.
 */
function Frankus_Print_Object(object) {
  for (let property in object) {
    let value = object[property];
    console.log(property + "=" + value);
  }
}

// =============================================================================
// Node Exports
// =============================================================================

module.exports = {
  frankusFile: frankusFile,
  frankusConfig: frankusConfig,
  frankusMime_Reader: frankusMime_Reader,
  frankusCoder_Doc: frankusCoder_Doc,
  frankusServer: frankusServer,
  frankusCode_Bank: frankusCode_Bank,
  Frankus_Split: Frankus_Split,
  Frankus_Check_Condition: Frankus_Check_Condition,
  Frankus_String_To_Hex: Frankus_String_To_Hex,
  Frankus_Compile_Markdown: Frankus_Compile_Markdown,
  Frankus_Number_To_Binary: Frankus_Number_To_Binary,
  Frankus_Binary_To_Number: Frankus_Binary_To_Number,
  Frankus_Print_Object: Frankus_Print_Object,
  Frankus_Update_Project_With_Boilerplate: Frankus_Update_Project_With_Boilerplate,
  Frankus_Create_Electron_App: Frankus_Create_Electron_App,
  Frankus_Process_Makefile: Frankus_Process_Makefile,
  Frankus_Generate_Resources: Frankus_Generate_Resources
};
