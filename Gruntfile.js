module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      src: ['src/**/*.js'],
      options: {
        browser: true,
        indent: 2,
        white: false,
        evil: true,
        regexdash: true,
        wsh: true,
        trailing: true,
        eqnull: true,
        expr: true,
        boss: true,
        node: true,
        strict: false
      }
    },

    qunit: {
      all: {
        options: {
          urls: ['http://localhost:8000/ice/test/test.html']
        }
      }
    },

    connect: {
      server: {
        options: {
          base: '../'
        }
      }
    },

    concat: {
      options: {
        stripBanners: true,
        banner: '//\n' +
          '// <%= pkg.name %> - v<%= pkg.version %>\n' +
          '// Copyright (c) The New York Times, CMS Group, Matthew DeLambo\n' +
          '// Copyright (c) Divotion B.V., Conflux, Dennis de Vries\n' +
          '// Licensed under the GNU General Public License v2.0 or later\n' +
          '//\n'
      },
      dist: {
        src: ['lib/rangy/rangy-core.js', 'src/ice.js', 'src/dom.js', 'src/bookmark.js', 'src/selection.js', 'src/icePlugin.js', 'src/icePluginManager.js', 'src/plugins/IceAddTitlePlugin/IceAddTitlePlugin.js', 'src/plugins/IceCopyPastePlugin/IceCopyPastePlugin.js', 'src/plugins/IceSmartQuotesPlugin/IceSmartQuotesPlugin.js', 'src/plugins/IceEmdashPlugin/IceEmdashPlugin.js'],
        dest: 'dist/ice.js'
      }
    },

    uglify: {
      options: {
        beautify : {
            ascii_only : true
          } ,
        preserveComments: false,
        banner: '//\n' +
          '// <%= pkg.name %> - v<%= pkg.version %>\n' +
          '// Copyright (c) The New York Times, CMS Group, Matthew DeLambo\n' +
          '// Copyright (c) Divotion B.V., Conflux, Dennis de Vries\n' +
          '// Licensed under the GNU General Public License v2.0 or later\n' +
          '//\n'
      },
      ice: {
        files: {
          'dist/ice.min.js': ['dist/ice.js']
        }
      },
      all: {
        files: [
          {
            expand: true,
            cwd: 'dist/',
            src: ['**/*.js', '!**/*.min.js'],
            dest: 'dist/',
            ext: '.min.js',
            extDot: 'last'
          }
        ]
      }
    },

    compress: {
      zip: {
        options: {
          archive: 'dist/ice_<%= pkg.version %>.zip'
        },
        files: [
          {src: './**', cwd: 'dist/', expand:true}
        ]
      }
    },

    clean: {
      build: ['dist'],
      demo: ['demo/dist', 'demo/lib']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('test', ['connect', 'qunit']);

  grunt.registerTask('build', ['clean:build', 'clean:demo', 'concat', 'uglify:ice', 'cp', 'uglify:all', 'compress:zip']);

  grunt.registerTask('cp', function() {
    cpTinyDir('ice');
    cpTinyDir('icesearchreplace');
  });

  grunt.registerTask('demo:copy', function() {
    grunt.file.recurse('dist/', function(abspath, rootdir, subdir, filename) {
      grunt.file.copy(abspath, 'demo/dist/' + (subdir ? subdir + '/' : '') + filename);
    });
    grunt.file.recurse('lib/', function(abspath, rootdir, subdir, filename) {
      grunt.file.copy(abspath, 'demo/lib/' + (subdir ? subdir + '/' : '') + filename);
    });
  });

  grunt.registerTask('demo:prepare', ['clean:demo', 'demo:copy']);

  var cpTinyDir = function(dir) {
    grunt.file.recurse('src/tinymce/plugins/' + dir + '/', function(abspath, rootdir, subdir, filename) {
      grunt.file.copy(rootdir + '/' + (subdir ? subdir + '/' : '') + filename,'dist/tinymce/plugins/' + dir + '/' + (subdir ? subdir + '/' : '') + '/' + filename);
    });
  };

};
