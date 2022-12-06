using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection.Metadata.Ecma335;
using System.Text.Json;
using static Files;

class Program
{
    readonly static string BasePath = "C:\\Users\\drphi\\Downloads\\";
    public static void Main(String[] args)
    {
        Stopwatch timer = Stopwatch.StartNew();
        GenerateNovelAIPrompts();
        timer.Stop();
        Console.WriteLine(timer.Elapsed);
    }

    public static void GenerateNovelAIPrompts()
    {
        String[] AI = new string[] { "NovelAI" };


        for (int i = 0; i < AI.Length; i++)
        {
            List<Files.Prompt> Prompts = new List<Files.Prompt>();

            Console.WriteLine(AI[i] + ":");
            string[] files = Directory.GetFiles($"{BasePath}/{AI[i]}");
            Console.WriteLine($"Found {files.Length} files!");

            Parallel.ForEach(files, file =>
            {
                if (file.IndexOf("_") != -1)
                {
                    int indexOfFinalUnderscore = file.LastIndexOf('_');
                    int SubstringLength = file.Length - indexOfFinalUnderscore - 5;
                    string ID = file.Substring(indexOfFinalUnderscore + 1, SubstringLength);

                    int length = file.Length - (BasePath.Length + AI[i].Length + 3 + ID.Length) - 4;
                    string prompt = file.Substring(BasePath.Length + AI[i].Length + 2, length).Trim().TrimEnd(',');

                    // Extract necessary information about each prompt.
                    string path = $"{BasePath}/{AI[i]}/{file}";
                    Dictionary<string, string> components = Files.GetComponents(file);
                    string[] tags;

                    if (components.Count > 0)
                        tags = components["parameters"].Split(",");

                    // If the complex tags can't be acquired, use the file name.
                    else
                        tags = prompt.Split(",");

                    List<string> finalizedTags = new List<string>();
                    for (int indexInTagsList = 0; indexInTagsList < tags.Length; indexInTagsList++)
                    {
                        if (tags[indexInTagsList].Trim() != "")
                            finalizedTags.Add(tags[indexInTagsList].Trim());
                    }

                    Prompts.Add(new Files.Prompt(finalizedTags.ToArray(), new List<string>() { ID }));
                }
            });

            // Merge the prompts.
            Prompts = Files.MatchPromptsByTags(Prompts);

            // Output the result to a file.
            List<string> outputPrompts = new List<string>();
            Response response = new() { sucessful = true, prompts = Prompts.ToArray() };

            string output = JsonSerializer.Serialize(response);
            Console.WriteLine(output);

            Console.WriteLine(Prompts[0].ToString());

            File.WriteAllText($"{BasePath}/{AI}_Prompts.json", output);
        }
    }

    public class Response
    {
        public bool sucessful { get; set; }
        public Prompt[] prompts { get; set; }
    }

    public static string StringArrayToString(String[] array)
    {
        string output = "";
        foreach (String s in array)
        {
            output += $"{s}, ";
        }

        return output.Trim().TrimEnd(',');
    }
}

class Files
{
    /// <summary>
    /// Written by ChatGPT, this function matches prompts.
    /// </summary>
    /// <param name="prompts"></param>
    /// <returns></returns>
    public static List<Prompt> MatchPromptsByTags(List<Prompt> prompts)
    {
        // Create a dictionary to store matching prompts by their tags
        Dictionary<string, Prompt> matchedPrompts = new Dictionary<string, Prompt>();

        // Loop through each prompt in the input list
        foreach (Prompt prompt in prompts)
        {
            // Convert the prompt's tags to a string
            string promptTags = String.Join(",", prompt.tags);

            // If the dictionary already contains a prompt with the same tags, add the current prompt's images to it
            if (matchedPrompts.ContainsKey(promptTags))
            {
                matchedPrompts[promptTags].images.AddRange(prompt.images);
            }
            // Otherwise, add the current prompt to the dictionary
            else
            {
                matchedPrompts.Add(promptTags, prompt);
            }
        }

        // Return the values (prompts) from the dictionary as a list
        return matchedPrompts.Values.ToList();
    }
    public class Prompt
    {
        public string[] tags { get; set; }
        public List<string> images { get; set; }

        public Prompt(string[] tags, List<string> images)
        {
            this.tags = tags;
            this.images = images;
        }

        public void AddImage(string image)
        {
            images.Add(image);
        }

        public override string ToString()
        {
            return JsonSerializer.Serialize(this);
        }
    }
    public static Dictionary<string, string> GetComponents(string fileToRead)
    {
        try
        {
            if (!string.IsNullOrEmpty(fileToRead) && File.Exists(fileToRead) && fileToRead.Contains("NovelAI"))
            {
                // Obtain the data from the file.
                var OGdata = File.ReadAllText(fileToRead);
                var data = OGdata;
                var start = data.IndexOf("tEXt") + 4;
                var end = data.IndexOf(", Model hash: ");
                var promptText = data.Substring(start, end - start);

                // Split the data into parts.
                var parts = promptText.Replace("\x00", ": ").Replace("\x00", ": ").Replace("\u00001", ": ").Split('\n');

                // Process each part into its own parts. (Part name and content.)
                var partsParts = new List<string[]>();
                for (var i = 0; i < parts.Length - 1; i++)
                    partsParts.Add(parts[i].Split(": "));


                // Split the last part into its parts.
                var compoundPart = parts[2].Split(", ");
                for (var i = 0; i < compoundPart.Length; i++)
                {
                    partsParts.Add(compoundPart[i].Split(": "));
                }

                // Code each part onto a C# dictionary.
                var response = new Dictionary<string, string>();
                foreach (var part in partsParts)
                {
                    response[part[0].Replace(" ", "")] = part[1];
                }

                // Cache the response, so that the next call can be sped up, then return it. 
                return response;
            }
        } catch
        {
            // Do nothing.
        }

        return new Dictionary<string, string>();
    }
}