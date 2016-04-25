  class ScriptTag < Liquid::Block

    def initialize(tag_name, text, tokens)
      super
      @text = text
    end

    def render(context)
      #site      = context.registers[:site]
      #converter = site.getConverterImpl(Jekyll::Converters::Markdown)

      #content = super.strip
      #content = converter.convert(content)
      "<script>#{ super.strip }</script>"
    end
  end

Liquid::Template.register_tag('javascript', ScriptTag)
